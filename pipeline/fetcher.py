"""
OpenAlex Data Ingestion Module.
Implements polite pool compliance, cursor pagination (complete windows, not "the newest N"),
exponential backoff with Retry-After, and batch hydration for research paper metadata.
"""

import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterator, List, Optional

from .config import PipelineConfig
from .models import RecentPaper

logger = logging.getLogger("OpenAlexFetcher")

RECENT_SELECT = "id,title,publication_date,publication_year,authorships,primary_topic,referenced_works,doi"
HYDRATE_SELECT = (
    "id,title,publication_year,publication_date,authorships,primary_topic,cited_by_count,doi,abstract_inverted_index"
)


def utc_today() -> datetime:
    return datetime.now(timezone.utc)


def concept_filter(concept_ids: List[str]) -> str:
    return "concepts.id:" + "|".join(concept_ids)


def search_filter(query: str) -> str:
    """OpenAlex title+abstract search filter for a user topic (supports quotes, AND/OR)."""
    cleaned = query.replace(",", " ").strip()
    return f"title_and_abstract.search:{cleaned}"


class OpenAlexClient:
    BASE_URL = "https://api.openalex.org/works"
    RETRYABLE = {408, 425, 429, 500, 502, 503, 504}

    def __init__(self, config: PipelineConfig, sleep=time.sleep):
        self.config = config
        contact = f" (mailto:{config.polite_email})" if config.polite_email else ""
        self.user_agent = f"AI-Research-Velocity-Digest/2.0{contact}"
        self._sleep = sleep

    # ------------------------------------------------------------------ transport
    def _make_request(self, url: str, max_retries: int = 4) -> Dict[str, Any]:
        """HTTP GET with backoff. urllib raises HTTPError for every non-2xx, so status handling lives there."""
        req = urllib.request.Request(
            url, headers={"User-Agent": self.user_agent, "Accept": "application/json"}
        )
        backoff = 1.0
        last_error: Optional[Exception] = None
        for attempt in range(1, max_retries + 1):
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    return json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                last_error = e
                if e.code not in self.RETRYABLE:
                    raise RuntimeError(f"OpenAlex HTTP {e.code} (not retryable): {url[:160]}") from e
                retry_after = e.headers.get("Retry-After") if e.headers else None
                wait = float(retry_after) if retry_after and retry_after.isdigit() else backoff
                logger.warning(f"HTTP {e.code} on attempt {attempt}/{max_retries}; waiting {wait:.1f}s")
                self._sleep(wait)
                backoff *= 2.0
            except Exception as e:  # network, timeout, bad JSON
                last_error = e
                logger.warning(f"Network error on attempt {attempt}/{max_retries}: {e}")
                self._sleep(backoff)
                backoff *= 2.0
        raise RuntimeError(f"Failed to fetch data from OpenAlex after {max_retries} attempts: {last_error}")

    def _params(self, extra: Dict[str, str]) -> str:
        params = dict(extra)
        if self.config.polite_email:
            params["mailto"] = self.config.polite_email
        return urllib.parse.urlencode(params)

    # ------------------------------------------------------------------ ingest
    def iter_recent_papers(
        self, topic_filter: str, start: datetime, end: datetime, cap: int
    ) -> Iterator[RecentPaper]:
        """
        Yields papers (with references) published in [start, end], newest first, following the OpenAlex
        cursor until the window is exhausted or `cap` papers were yielded. If the cap stops the run early the
        caller can see it: `self.last_truncated`.
        """
        filters = ",".join(
            [
                f"from_publication_date:{start.strftime('%Y-%m-%d')}",
                f"to_publication_date:{end.strftime('%Y-%m-%d')}",
                topic_filter,
                "has_references:true",
            ]
        )
        cursor = "*"
        yielded = 0
        self.last_truncated = False
        while True:
            url = f"{self.BASE_URL}?" + self._params(
                {
                    "filter": filters,
                    "select": RECENT_SELECT,
                    "sort": "publication_date:desc",
                    "per-page": "100",
                    "cursor": cursor,
                }
            )
            data = self._make_request(url)
            results = data.get("results", [])
            for item in results:
                refs = item.get("referenced_works") or []
                if not refs:
                    continue
                primary = item.get("primary_topic") or {}
                authors = [
                    a.get("author", {}).get("display_name")
                    for a in item.get("authorships", [])
                    if a.get("author", {}).get("display_name")
                ]
                yield RecentPaper(
                    id=item.get("id", ""),
                    title=item.get("title") or "Untitled Work",
                    publication_date=item.get("publication_date") or "",
                    publication_year=item.get("publication_year") or end.year,
                    primary_topic=primary.get("display_name") or "Unclassified",
                    authors=authors[:5],
                    referenced_works=refs,
                    doi=item.get("doi"),
                )
                yielded += 1
                if yielded >= cap:
                    self.last_truncated = True
                    return
            cursor = (data.get("meta") or {}).get("next_cursor")
            if not results or not cursor:
                return
            self._sleep(0.12)

    def fetch_recent_papers(self) -> List[RecentPaper]:
        """Default AI topic over the configured lookback window (kept for the CLI / analyzer)."""
        end = utc_today()
        start = end - timedelta(days=self.config.lookback_days)
        logger.info(f"Ingesting recent papers published between {start:%Y-%m-%d} and {end:%Y-%m-%d}")
        papers = list(
            self.iter_recent_papers(
                concept_filter(self.config.concept_ids), start, end, self.config.max_recent_papers_to_scan
            )
        )
        logger.info(
            f"Ingested {len(papers)} papers with references (cap reached: {self.last_truncated})"
        )
        return papers

    # ------------------------------------------------------------------ hydrate
    def hydrate_papers_batch(self, openalex_work_ids: List[str]) -> List[Dict[str, Any]]:
        """Fetches metadata for OpenAlex work ids, 40 per request (URL length / filter limits)."""
        if not openalex_work_ids:
            return []
        hydrated: List[Dict[str, Any]] = []
        chunk_size = 40
        for i in range(0, len(openalex_work_ids), chunk_size):
            chunk = [cid.split("/")[-1] for cid in openalex_work_ids[i : i + chunk_size]]
            url = f"{self.BASE_URL}?" + self._params(
                {
                    "filter": "openalex_id:" + "|".join(chunk),
                    "per-page": str(chunk_size),
                    "select": HYDRATE_SELECT,
                }
            )
            try:
                hydrated.extend(self._make_request(url).get("results", []))
            except Exception as e:
                logger.error(f"Failed to hydrate batch starting at {i}: {e}")
            self._sleep(0.12)
        return hydrated
