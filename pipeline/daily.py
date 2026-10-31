"""
Daily job: ingest new papers of every active topic into the database, then recompute the indices.

    python -m pipeline.daily                       # all active topics, incremental
    python -m pipeline.daily --topic "Surrogate safety measures"   # add/refresh one topic first
    python -m pipeline.daily --db postgresql://...  # or DATABASE_URL in the environment

Designed for a free scheduler (GitHub Actions cron) with the database on Neon: nothing runs on a local PC.
"""

import argparse
import json
import logging
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .config import PipelineConfig, get_config
from .fetcher import OpenAlexClient, concept_filter, search_filter
from .insights import compute_topic_insights
from .store import Store, slugify

logger = logging.getLogger("Daily")

DEFAULT_TOPIC_ID = "ai-research"
BACKFILL_DAYS = 30
OVERLAP_DAYS = 3  # re-read a few days back: OpenAlex indexes papers late; writes are idempotent
FOCUSED_CAP = 1000


def seed_topics(store: Store, cfg: PipelineConfig, seed_file: Optional[Path]) -> None:
    store.upsert_topic(
        "AI / ML / Computer Vision (broad)",
        " OR ".join(cfg.subfields),
        kind="concepts",
        hydrate_all=False,
        topic_id=DEFAULT_TOPIC_ID,
    )
    if seed_file and seed_file.exists():
        existing = {t["topic_id"] for t in store.list_topics(active_only=False)}
        for item in json.loads(seed_file.read_text(encoding="utf-8")):
            tid = item.get("topic_id") or slugify(item["label"])
            if tid not in existing:  # never reactivate a topic the owner switched off
                store.upsert_topic(item["label"], item["query"], kind="search", hydrate_all=True, topic_id=tid)


def topic_filter(topic: Dict[str, Any], cfg: PipelineConfig) -> str:
    if topic["kind"] == "concepts":
        return concept_filter(cfg.concept_ids)
    return search_filter(topic["query"])


def ingest_topic(store: Store, client: OpenAlexClient, topic: Dict[str, Any], cfg: PipelineConfig, days: Optional[int]) -> Dict[str, Any]:
    first_time = not any(r["topic_id"] == topic["topic_id"] and r["status"] == "ok" for r in store.last_runs(500))
    span = days if days is not None else (BACKFILL_DAYS if first_time else OVERLAP_DAYS)
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=span)
    cap = cfg.max_recent_papers_to_scan if topic["kind"] == "concepts" else max(cfg.max_recent_papers_to_scan, FOCUSED_CAP)
    run_id = uuid.uuid4().hex[:12]
    store.start_run(run_id, topic["topic_id"])
    try:
        flt = topic_filter(topic, cfg)
        seen = new_papers = new_edges = 0
        truncated = False
        if topic["kind"] == "concepts":
            # a broad topic has far more papers per day than the cap: sample EVERY day (cap per day) so each
            # window is covered evenly, instead of "the newest N papers" which would all be from one day
            ranges = [(end - timedelta(days=i), end - timedelta(days=i)) for i in range(span + 1)]
        else:
            ranges = [(start, end)]
        for lo, hi in ranges:
            papers = list(client.iter_recent_papers(flt, lo, hi, cap))
            n_p, n_e = store.save_papers(topic["topic_id"], papers)
            seen, new_papers, new_edges = seen + len(papers), new_papers + n_p, new_edges + n_e
            truncated = truncated or client.last_truncated
        store.finish_run(run_id, "ok", seen, new_papers, new_edges, truncated)
        return {"seen": seen, "new_papers": new_papers, "new_edges": new_edges, "truncated": truncated, "span_days": span}
    except Exception as e:
        store.finish_run(run_id, "error", 0, 0, 0, False, str(e))
        raise


def run_daily(cfg: PipelineConfig, store: Store, days: Optional[int] = None, only_topic: Optional[str] = None,
              skip_insights: bool = False, client: Optional[OpenAlexClient] = None) -> int:
    client = client or OpenAlexClient(cfg)
    topics = store.list_topics()
    if only_topic:
        topics = [t for t in topics if t["topic_id"] == only_topic]
    failures = 0
    for topic in topics:
        logger.info(f"== topic {topic['topic_id']} ({topic['label']})")
        try:
            result = ingest_topic(store, client, topic, cfg, days)
            logger.info(f"   ingest: {result}")
            if not skip_insights:
                summary = compute_topic_insights(store, client, topic, cfg)
                logger.info(f"   insights: {json.dumps(summary)}")
        except Exception as e:
            failures += 1
            logger.error(f"   topic {topic['topic_id']} failed: {e}")
    retain = int(os.getenv("RETAIN_DAYS", "90"))
    cutoff = (datetime.now(timezone.utc) - timedelta(days=retain)).strftime("%Y-%m-%d")
    logger.info(f"pruned (older than {retain} days): {store.prune(cutoff)}")
    logger.info(f"totals: {store.totals()}")
    return 1 if failures else 0


def main(argv: Optional[List[str]] = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s", datefmt="%H:%M:%S")
    p = argparse.ArgumentParser(description="Daily citation-database ingest and index computation")
    p.add_argument("--db", default=None, help="Postgres URL or SQLite path (default: DATABASE_URL or output/research_velocity.db)")
    p.add_argument("--topic", action="append", default=[], help="add/refresh a focused topic (OpenAlex title+abstract search query)")
    p.add_argument("--only", default=None, help="process only this topic id")
    p.add_argument("--days", type=int, default=None, help="override the ingest span (default: 30 first time, 3 afterwards)")
    p.add_argument("--seed-file", default="config/topics.default.json")
    p.add_argument("--skip-insights", action="store_true")
    args = p.parse_args(argv)

    cfg = get_config()
    store = Store(args.db or cfg.database_url)
    seed_topics(store, cfg, Path(args.seed_file) if args.seed_file else None)
    for query in args.topic:
        store.upsert_topic(query, query, kind="search", hydrate_all=True)
    return run_daily(cfg, store, args.days, args.only, args.skip_insights)


if __name__ == "__main__":
    sys.exit(main())
