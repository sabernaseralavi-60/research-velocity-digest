"""
Inverted Citation Indexing and Research Velocity Analyzer Module.
"""

import logging
import time
from collections import Counter
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple

from .config import PipelineConfig
from .models import RecentPaper, TrendingPaper, PipelineReport, CitingPaperSample
from .scholar import generate_scholar_url, reconstruct_abstract_inverted_index
from .fetcher import OpenAlexClient

logger = logging.getLogger("VelocityAnalyzer")


class InvertedCitationAnalyzer:
    def __init__(self, config: PipelineConfig, client: OpenAlexClient):
        self.config = config
        self.client = client

    def analyze(self) -> PipelineReport:
        """
        Executes the full inverted indexing pipeline:
        1. Ingest newly published AI/ML papers in recent window.
        2. Invert citation links (extract referenced_works -> counter).
        3. Filter for cited papers with citation velocity >= threshold.
        4. Hydrate top candidate works with full metadata.
        5. Build Google Scholar links, format abstract summaries, and rank.
        """
        start_time = time.time()
        now = datetime.utcnow()
        start_date = now - timedelta(days=self.config.lookback_days)

        # Step 1: Ingest recent papers
        recent_papers = self.client.fetch_recent_papers()
        if not recent_papers:
            logger.warning("No recent papers returned from OpenAlex for this window.")
            return PipelineReport(
                lookback_days=self.config.lookback_days,
                start_date=start_date.strftime("%Y-%m-%d"),
                end_date=now.strftime("%Y-%m-%d"),
                recent_papers_scanned=0,
                total_references_extracted=0,
                unique_works_cited=0,
                trending_threshold=self.config.min_citation_velocity,
                trending_papers=[],
                execution_time_seconds=time.time() - start_time,
                subfields_covered=self.config.subfields,
            )

        # Step 2: Build Inverted Reference Index
        logger.info(f"Building inverted reference index across {len(recent_papers)} papers...")
        reference_counter: Counter = Counter()
        citing_map: Dict[str, List[CitingPaperSample]] = {}
        total_references = 0

        for paper in recent_papers:
            # Deduplicate per paper so multi-citations inside the same work count once per citing work
            unique_refs = set(paper.referenced_works)
            total_references += len(unique_refs)

            for ref_id in unique_refs:
                if not ref_id:
                    continue
                # Normalize OpenAlex ID (e.g. https://openalex.org/W2741809807 -> W2741809807)
                norm_id = ref_id.split("/")[-1]
                reference_counter[norm_id] += 1

                if norm_id not in citing_map:
                    citing_map[norm_id] = []
                if len(citing_map[norm_id]) < 4:
                    citing_map[norm_id].append(
                        CitingPaperSample(id=paper.id, title=paper.title)
                    )

        unique_cited = len(reference_counter)
        logger.info(f"Extracted {total_references} reference links across {unique_cited} unique cited papers")

        # Step 3: Filter by dynamic velocity threshold
        candidate_items = [
            (work_id, count)
            for work_id, count in reference_counter.most_common()
            if count >= self.config.min_citation_velocity
        ]

        # If threshold yields too few, dynamically fall back to top N if available
        if len(candidate_items) < 3 and unique_cited > 0:
            logger.info(
                f"Few papers met threshold {self.config.min_citation_velocity}. "
                f"Taking top {self.config.top_n_papers} cited works as fallback."
            )
            candidate_items = reference_counter.most_common(self.config.top_n_papers)

        top_candidates = candidate_items[: self.config.top_n_papers]
        candidate_ids = [work_id for work_id, _ in top_candidates]
        velocity_lookup = dict(top_candidates)

        # Step 4: Hydrate details for top trending papers
        hydrated_records = self.client.hydrate_papers_batch(candidate_ids)
        trending_papers: List[TrendingPaper] = []

        for record in hydrated_records:
            work_id = record.get("id", "").split("/")[-1]
            velocity = velocity_lookup.get(work_id, 0)
            all_time = record.get("cited_by_count") or velocity
            title = record.get("title") or "Untitled Publication"
            year = record.get("publication_year") or now.year

            authors = []
            for auth in record.get("authorships", []):
                name = auth.get("author", {}).get("display_name")
                if name:
                    authors.append(name)
            authors = authors[:5] if authors else ["Author unavailable"]

            topic_obj = record.get("primary_topic") or {}
            topic_name = topic_obj.get("display_name") or "Artificial Intelligence"
            subfield_name = (
                topic_obj.get("subfield", {}).get("display_name")
                or "Computer Science"
            )

            # Reconstruct abstract
            abstract_text = reconstruct_abstract_inverted_index(
                record.get("abstract_inverted_index")
            )
            if abstract_text and len(abstract_text) > 350:
                abstract_text = abstract_text[:347] + "..."

            # Scholar and DOI URLs
            first_author = authors[0] if authors else None
            scholar_link = generate_scholar_url(title, first_author, year)
            doi = record.get("doi")
            doi_link = f"https://doi.org/{doi}" if doi and not doi.startswith("http") else doi

            velocity_ratio = (
                min(100, round((velocity / all_time) * 100)) if all_time > 0 else 100
            )

            trending = TrendingPaper(
                id=work_id,
                title=title,
                authors=authors,
                publication_year=year,
                primary_topic=topic_name,
                subfield=subfield_name,
                recent_citation_velocity=velocity,
                all_time_citations=all_time,
                velocity_ratio_percent=velocity_ratio,
                scholar_url=scholar_link,
                openalex_url=f"https://openalex.org/{work_id}",
                doi_url=doi_link,
                abstract=abstract_text or None,
                sample_citing_papers=citing_map.get(work_id, []),
            )
            trending_papers.append(trending)

        # Sort descending by citation velocity
        trending_papers.sort(key=lambda x: x.recent_citation_velocity, reverse=True)

        elapsed = time.time() - start_time
        logger.info(
            f"Analysis complete: {len(trending_papers)} trending papers discovered in {elapsed:.2f}s"
        )

        return PipelineReport(
            lookback_days=self.config.lookback_days,
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=now.strftime("%Y-%m-%d"),
            recent_papers_scanned=len(recent_papers),
            total_references_extracted=total_references,
            unique_works_cited=unique_cited,
            trending_threshold=self.config.min_citation_velocity,
            trending_papers=trending_papers,
            execution_time_seconds=elapsed,
            subfields_covered=self.config.subfields,
        )
