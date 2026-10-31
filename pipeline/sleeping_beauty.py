"""
Sleeping Beauties & Dormant Paradigm Shift Discovery Engine.

Algorithm:
Identifies foundational, overlooked, or revived works based on:
1. Sleeping Beauty Coefficient (B) & Citation Wakeup Velocity:
   Articles with modest historical citation counts but sudden recent citation acceleration.
2. Semantic Resonance Index:
   High citation influx from cutting-edge current preprints relative to total age.
3. Dormancy Duration (years in low citation before resurgence).
"""

import math
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class SleepingBeautyPaper:
    id: str
    title: str
    authors: List[str]
    publication_year: int
    dormancy_years: int
    recent_citations: int
    all_time_citations: int
    awakening_score: float  # Quantifies sudden citation acceleration relative to historical stagnation
    scholar_url: str
    openalex_url: str
    abstract: Optional[str] = None
    sample_awakening_citers: List[str] = None


def calculate_awakening_score(
    recent_velocity: int,
    all_time_citations: int,
    publication_year: int,
    current_year: int = 2026,
) -> float:
    """
    Computes an Awakening Score based on:
    - Age of publication (must be >= 3 years old to be considered dormant/sleeping).
    - Disproportionate recent citations vs. historical average.
    
    Formula:
      age = max(1, current_year - publication_year)
      historical_annual_avg = max(0.1, (all_time_citations - recent_velocity) / age)
      recent_burst_ratio = recent_velocity / historical_annual_avg
      awakening_score = recent_burst_ratio * math.log(age + 1)
    """
    age = max(1, current_year - publication_year)
    if age < 3:
        # Too recent to be a "sleeping" beauty; it's just a newly trending paper
        return 0.0

    prior_citations = max(0, all_time_citations - recent_velocity)
    historical_annual_rate = max(0.2, prior_citations / age)
    
    # Burst factor: How much this recent batch exceeds what historical rate would predict
    burst_multiplier = (recent_velocity * 52) / historical_annual_rate  # normalized to annual equivalent
    awakening_score = math.log10(burst_multiplier + 1) * math.sqrt(age)
    return round(awakening_score, 2)


def detect_sleeping_beauties(
    hydrated_papers: List[Dict[str, Any]],
    recent_citation_counts: Dict[str, int],
    citing_map: Dict[str, List[str]],
    min_dormancy_years: int = 3,
    min_recent_citations: int = 2,
    current_year: int = 2026,
) -> List[SleepingBeautyPaper]:
    """
    Scans the inverted citation index to detect slumbering gems that are awakening.
    """
    sleeping_beauties = []

    for paper in hydrated_papers:
        work_id = paper.get("id", "").split("/")[-1]
        pub_year = paper.get("publication_year") or current_year
        age = current_year - pub_year

        if age < min_dormancy_years:
            continue

        recent_citations = recent_citation_counts.get(work_id, 0)
        if recent_citations < min_recent_citations:
            continue

        all_time = paper.get("cited_by_count", recent_citations)
        score = calculate_awakening_score(recent_citations, all_time, pub_year, current_year)

        if score > 1.5:  # Filter for noticeable resurgence
            authors = [
                a.get("author", {}).get("display_name")
                for a in paper.get("authorships", [])
                if a.get("author", {}).get("display_name")
            ][:4]

            title = paper.get("title") or "Untitled Work"
            clean_title = title.replace('"', '').strip()

            sb = SleepingBeautyPaper(
                id=work_id,
                title=title,
                authors=authors or ["Unknown"],
                publication_year=pub_year,
                dormancy_years=age,
                recent_citations=recent_citations,
                all_time_citations=all_time,
                awakening_score=score,
                scholar_url=f'https://scholar.google.com/scholar?q="{clean_title}"&as_ylo={pub_year}',
                openalex_url=f"https://openalex.org/{work_id}",
                abstract=None,
                sample_awakening_citers=citing_map.get(work_id, [])[:3],
            )
            sleeping_beauties.append(sb)

    sleeping_beauties.sort(key=lambda x: x.awakening_score, reverse=True)
    return sleeping_beauties
