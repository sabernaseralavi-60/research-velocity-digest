"""
Computes the three indices of one topic from the database and stores them as snapshots the web app reads:
trending (inverted-index velocity), sleeping beauties (awakening), latent gems (pre-awakening).
"""

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from .config import PipelineConfig
from .fetcher import OpenAlexClient
from .latent_gems import LatentGemParams, latent_potential_score, passes_stagnation_filter
from .scholar import generate_scholar_url, reconstruct_abstract_inverted_index
from .sleeping_beauty import SleepingBeautyParams, is_sleeping_beauty
from .store import Store
from .textsim import rank_against

logger = logging.getLogger("Insights")

WINDOWS = (7, 30)
HYDRATE_CAP_FOCUSED = 6000  # works hydrated per topic and run for focused (user) topics
HYDRATE_CAP_BROAD = 400  # broad topics only hydrate what already looks hot


def _trim(text: str, n: int) -> str:
    return text if len(text) <= n else text[: n - 3] + "..."


def hydrate_missing(store: Store, client: OpenAlexClient, ids: List[str], cap: int) -> int:
    todo = store.missing_or_stale_works(ids)[:cap]
    if not todo:
        return 0
    records = client.hydrate_papers_batch(todo)
    for r in records:
        r["abstract_text"] = reconstruct_abstract_inverted_index(r.get("abstract_inverted_index"))
    store.upsert_works(records)
    return len(records)


def _openalex_url(work_id: str) -> str:
    return f"https://openalex.org/{work_id}"


def _work_view(w: Dict[str, Any]) -> Dict[str, Any]:
    authors = w.get("authors") or ["Author unavailable"]
    return {
        "id": w["work_id"],
        "title": w.get("title") or "Untitled Work",
        "authors": authors[:5],
        "publication_year": w.get("publication_year"),
        "primary_topic": w.get("primary_topic") or "Unclassified",
        "subfield": w.get("subfield") or "",
        "scholar_url": generate_scholar_url(w.get("title") or "", authors[0] if authors else None, w.get("publication_year")),
        "openalex_url": _openalex_url(w["work_id"]),
        "doi_url": (f"https://doi.org/{w['doi']}" if w.get("doi") and not str(w["doi"]).startswith("http") else w.get("doi")),
        "abstract": _trim(w["abstract"], 320) if w.get("abstract") else None,
    }


def compute_topic_insights(
    store: Store,
    client: OpenAlexClient,
    topic: Dict[str, Any],
    cfg: PipelineConfig,
    today: Optional[datetime] = None,
    windows=WINDOWS,
) -> Dict[str, Any]:
    today = today or datetime.now(timezone.utc)
    year = today.year
    tid = topic["topic_id"]
    started = time.time()
    summary: Dict[str, Any] = {"topic_id": tid, "windows": {}}

    for window in windows:
        since = (today - timedelta(days=window)).strftime("%Y-%m-%d")
        stats = store.topic_window_stats(tid, since)
        velocity_rows = store.velocity(tid, since, min_count=1, limit=5000)
        velocity = dict(velocity_rows)

        # --- hydrate: hot candidates always; every cited work for focused topics (gems need old, rare works)
        hot_ids = [i for i, n in velocity_rows if n >= 2][:HYDRATE_CAP_BROAD]
        wanted = [i for i, _ in velocity_rows] if topic.get("hydrate_all") else hot_ids
        cap = HYDRATE_CAP_FOCUSED if topic.get("hydrate_all") else HYDRATE_CAP_BROAD
        hydrated_now = hydrate_missing(store, client, wanted, cap)
        works = store.get_works(wanted)

        # --- trending
        threshold = cfg.min_citation_velocity
        above = [(i, n) for i, n in velocity_rows if n >= threshold]
        fallback = len(above) < 3
        # fewer than 3 works met the threshold: relax it to "cited at least twice" and flag it in
        # stats.threshold_fallback; a work cited once is never called trending
        picked = (above if not fallback else [(i, n) for i, n in velocity_rows if n >= 2])[: cfg.top_n_papers]
        picked_ids = [i for i, _ in picked]
        if not topic.get("hydrate_all"):
            hydrate_missing(store, client, picked_ids, cap)
            works.update(store.get_works(picked_ids))
        samples = store.citing_samples(tid, picked_ids, since, k=4)
        trending = []
        for wid, n in picked:
            w = works.get(wid)
            if not w:
                continue
            all_time = w.get("cited_by_count") or n
            view = _work_view(w)
            view.update(
                recent_citation_velocity=n,
                all_time_citations=all_time,
                velocity_ratio_percent=min(100, round(100 * n / all_time)) if all_time > 0 else 100,
                sample_citing_papers=samples.get(wid, []),
            )
            trending.append(view)
        trending.sort(key=lambda v: (-v["recent_citation_velocity"], v["id"]))

        # --- sleeping beauties (works whose recent citations are rare in their own history)
        sb_params = SleepingBeautyParams()
        sb_cands = [(i, n) for i, n in velocity_rows if n >= sb_params.min_recent_citations]
        hydrate_missing(store, client, [i for i, _ in sb_cands], cap)
        sb_works = store.get_works([i for i, _ in sb_cands])
        sleeping = []
        for wid, n in sb_cands:
            w = sb_works.get(wid)
            if not w:
                continue
            score = is_sleeping_beauty(n, window, w.get("cited_by_count"), w.get("publication_year"), year, sb_params)
            if score is None:
                continue
            view = _work_view(w)
            view.update(
                dormancy_years=year - w["publication_year"],
                recent_citations=n,
                all_time_citations=w["cited_by_count"],
                awakening_score=score,
                sample_awakening_citers=store.citing_samples(tid, [wid], since, k=3).get(wid, []),
            )
            sleeping.append(view)
        sleeping.sort(key=lambda v: (-v["awakening_score"], v["id"]))

        # --- latent gems (funnel: frontier -> ancestors -> stagnation -> lexical relevance)
        gem_params = LatentGemParams()
        gems = []
        if window == max(windows):
            gems = _latent_gems(store, tid, topic, since, velocity, works, year, gem_params)

        payload = {
            "topic": {k: topic[k] for k in ("topic_id", "label", "query", "kind")},
            "window_days": window,
            "since": since,
            "stats": {
                "recent_papers_scanned": stats["papers"],
                "total_references_extracted": stats["edges"],
                "unique_works_cited": stats["unique_cited"],
                "trending_threshold": threshold,
                "trending_found_count": len(trending),
                "threshold_fallback": fallback,
                "works_hydrated_this_run": hydrated_now,
            },
            "trending": trending,
            "sleeping_beauties": sleeping[:25],
            "latent_gems": gems[:25],
            "methods": {
                "similarity": "lexical TF-IDF cosine (not a semantic embedding)",
                "funnel_hops": 1,
                "awakening_min_score": sb_params.min_score,
                "gem_filters": {
                    "min_age": gem_params.min_age,
                    "max_age": gem_params.max_age,
                    "max_citations": gem_params.max_citations,
                    "min_similarity": gem_params.min_similarity,
                },
            },
        }
        store.save_snapshot("insights", tid, window, payload)
        summary["windows"][window] = {
            "trending": len(trending), "sleeping": len(sleeping), "gems": len(gems), "stats": stats,
        }
    summary["seconds"] = round(time.time() - started, 1)
    return summary


def _latent_gems(
    store: Store, tid: str, topic: Dict[str, Any], since: str,
    velocity: Dict[str, int], works: Dict[str, Dict[str, Any]], year: int, params: LatentGemParams,
) -> List[Dict[str, Any]]:
    cands = []
    for wid, evidence in velocity.items():
        w = works.get(wid)
        if not w or w.get("publication_year") is None or w.get("cited_by_count") is None:
            continue
        if passes_stagnation_filter(w["publication_year"], w["cited_by_count"], year, params):
            cands.append((wid, w, evidence))
    if not cands:
        return []
    profile_cache: Dict[str, str] = {}
    texts = []
    for wid, w, _ in cands:
        texts.append(f"{w.get('title') or ''} {w.get('abstract') or ''}")
        profile_cache[wid] = " ".join(store.citing_titles(tid, wid, since, k=10))
    # topic profile: the topic query plus the titles of the recent papers that cite the candidates
    profile = topic["query"] + " " + " ".join(profile_cache.values())
    sims = rank_against(profile, texts)
    gems = []
    for (wid, w, evidence), sim in zip(cands, sims):
        if sim < params.min_similarity:
            continue
        age = year - w["publication_year"]
        score = latent_potential_score(sim, w["cited_by_count"], age, evidence)
        if score < params.min_score:
            continue
        view = _work_view(w)
        view.update(
            dormancy_years=age,
            all_time_citations=w["cited_by_count"],
            latent_potential_score=score,
            lexical_similarity=round(sim, 3),
            recent_topic_papers_citing=evidence,
            semantic_overlap_concept=topic["label"],
            why_valuable=(
                f"Published {w['publication_year']} with {w['cited_by_count']} citations in total, "
                f"yet cited by {evidence} recent paper(s) of '{topic['label']}' "
                f"(lexical similarity {sim:.2f})."
            ),
        )
        gems.append(view)
    gems.sort(key=lambda v: (-v["latent_potential_score"], v["id"]))
    return gems
