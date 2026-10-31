"""
Data models and typed representations for research papers, velocity metrics,
and digest reporting.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class CitingPaperSample:
    id: str
    title: str


@dataclass
class RecentPaper:
    id: str
    title: str
    publication_date: str
    publication_year: int
    primary_topic: str
    authors: List[str]
    referenced_works: List[str]
    doi: Optional[str] = None


@dataclass
class TrendingPaper:
    id: str
    title: str
    authors: List[str]
    publication_year: int
    primary_topic: str
    subfield: str
    recent_citation_velocity: int  # Citations received strictly within this recent batch
    all_time_citations: int        # Total historical citations according to OpenAlex
    velocity_ratio_percent: int    # (recent / all_time) * 100
    scholar_url: str               # Direct Google Scholar search link
    openalex_url: str              # OpenAlex landing page
    doi_url: Optional[str] = None  # Direct Publisher / DOI link
    abstract: Optional[str] = None # Plaintext summary / key takeaway
    sample_citing_papers: List[CitingPaperSample] = field(default_factory=list)


@dataclass
class PipelineReport:
    lookback_days: int
    start_date: str
    end_date: str
    recent_papers_scanned: int
    total_references_extracted: int
    unique_works_cited: int
    trending_threshold: int
    trending_papers: List[TrendingPaper]
    execution_time_seconds: float
    subfields_covered: List[str]
