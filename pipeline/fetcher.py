"""
OpenAlex Data Ingestion Module.
Implements polite pool compliance, pagination, exponential backoff,
and batch hydration for research paper metadata.
"""

import json
import logging
import time
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from .config import PipelineConfig
from .models import RecentPaper

logger = logging.getLogger("OpenAlexFetcher")


class OpenAlexClient:
    BASE_URL = "https://api.openalex.org/works"

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.user_agent = f"AI-Research-Velocity-Digest/1.0 (mailto:{self.config.polite_email})"

    def _make_request(self, url: str, max_retries: int = 4) -> Dict[str, Any]:
        """
        Executes an HTTP GET with polite pool headers and exponential backoff retry.
        """
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": self.user_agent,
                "Accept": "application/json",
            },
        )

        backoff = 1.0
        for attempt in range(1, max_retries + 1):
            try:
                with urllib.request.urlopen(req, timeout=25) as response:
                    if response.status == 200:
                        data = json.loads(response.read().decode("utf-8"))
                        return data
                    elif response.status == 429:
                        logger.warning(f"Rate limited (429). Backing off for {backoff:.1f}s (attempt {attempt}/{max_retries})")
                        time.sleep(backoff)
                        backoff *= 2.0
                    else:
                        logger.error(f"HTTP error {response.status} fetching {url}")
                        time.sleep(backoff)
                        backoff *= 1.5
            except urllib.error.HTTPError as e:
                logger.warning(f"HTTP error {e.code} on attempt {attempt}: {e.reason}")
                if e.code == 429:
                    time.sleep(backoff)
                    backoff *= 2.0
                else:
                    time.sleep(backoff)
                    backoff *= 1.5
            except Exception as e:
                logger.warning(f"Network error on attempt {attempt}: {str(e)}")
                time.sleep(backoff)
                backoff *= 2.0

        raise RuntimeError(f"Failed to fetch data from OpenAlex after {max_retries} attempts: {url}")

    def fetch_recent_papers(self) -> List[RecentPaper]:
        """
        Fetches newly published papers indexed within the past lookback_days
        across Artificial Intelligence, Machine Learning, and Computer Vision subfields.
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=self.config.lookback_days)
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")

        logger.info(f"Ingesting recent papers published between {start_str} and {end_str}")

        # Construct OpenAlex query filter
        concept_filter = "|".join(self.config.concept_ids)
        filters = [
            f"from_publication_date:{start_str}",
            f"to_publication_date:{end_str}",
            f"concepts.id:{concept_filter}",
            "has_references:true",
        ]
        filter_str = ",".join(filters)

        # Select minimal payload fields for high throughput
        select_fields = "id,title,publication_date,publication_year,authorships,primary_topic,referenced_works,doi"

        recent_papers: List[RecentPaper] = []
        page = 1
        per_page = 100
        scanned_count = 0

        while scanned_count < self.config.max_recent_papers_to_scan:
            params = {
                "filter": filter_str,
                "select": select_fields,
                "sort": "publication_date:desc",
                "per-page": str(per_page),
                "page": str(page),
                "mailto": self.config.polite_email,
            }
            url = f"{self.BASE_URL}?{urllib.parse.urlencode(params)}"

            try:
                data = self._make_request(url)
            except Exception as err:
                logger.error(f"Error fetching page {page}: {err}")
                break

            results = data.get("results", [])
            if not results:
                break

            for item in results:
                ref_works = item.get("referenced_works", [])
                if not ref_works:
                    continue

                # Extract authors
                authors = []
                for auth in item.get("authorships", []):
                    display_name = auth.get("author", {}).get("display_name")
                    if display_name:
                        authors.append(display_name)

                # Extract primary topic
                primary_topic = item.get("primary_topic") or {}
                topic_name = primary_topic.get("display_name") or "Artificial Intelligence"

                paper = RecentPaper(
                    id=item.get("id", ""),
                    title=item.get("title") or "Untitled Work",
                    publication_date=item.get("publication_date", ""),
                    publication_year=item.get("publication_year") or end_date.year,
                    primary_topic=topic_name,
                    authors=authors[:5],
                    referenced_works=ref_works,
                    doi=item.get("doi"),
                )
                recent_papers.append(paper)
                scanned_count += 1

                if scanned_count >= self.config.max_recent_papers_to_scan:
                    break

            # Polite pacing
            time.sleep(0.12)
            page += 1

        logger.info(f"Ingested {len(recent_papers)} recent AI papers with references from past {self.config.lookback_days} days")
        return recent_papers

    def hydrate_papers_batch(self, openalex_work_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Fetches detailed metadata for a list of target OpenAlex work IDs.
        Chunks IDs into batches of 40 to avoid HTTP URI length limits.
        """
        if not openalex_work_ids:
            return []

        logger.info(f"Hydrating detailed metadata for {len(openalex_work_ids)} candidate trending works")
        hydrated: List[Dict[str, Any]] = []
        chunk_size = 40

        for i in range(0, len(openalex_work_ids), chunk_size):
            chunk = openalex_work_ids[i : i + chunk_size]
            # Strip URLs if present, leaving canonical ID (e.g., W2741809807)
            clean_ids = [cid.split("/")[-1] for cid in chunk]
            id_filter = "|".join(clean_ids)

            params = {
                "filter": f"openalex_id:{id_filter}",
                "per-page": str(chunk_size),
                "select": "id,title,publication_year,publication_date,authorships,primary_topic,cited_by_count,doi,abstract_inverted_index",
                "mailto": self.config.polite_email,
            }
            url = f"{self.BASE_URL}?{urllib.parse.urlencode(params)}"

            try:
                data = self._make_request(url)
                hydrated.extend(data.get("results", []))
            except Exception as e:
                logger.error(f"Failed to hydrate batch chunk {i}: {e}")

            time.sleep(0.12)

        return hydrated
