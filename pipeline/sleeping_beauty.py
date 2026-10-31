"""
Sleeping Beauties: old works that are cited again by the newest papers.

awakening = log10(recent_annual_rate / historical_annual_rate + 1) * sqrt(age)

  age                  = today.year - publication_year   (must be >= min_dormancy_years)
  recent_annual_rate   = recent_citations * 365 / window_days   (citations seen in OUR scanned papers,
                         so it undercounts the real recent rate: conservative)
  historical_rate      = max(0.2, (all_time - recent) / age)    per year; the floor stops a work with no
                         history from getting an unbounded ratio
The threshold (default 1.5) and the formula are a ranking heuristic taken from the owner's spec; they are
not calibrated against ground truth (see docs/factory/VERIFIED.md).
"""

import math
from dataclasses import dataclass
from typing import Optional

HISTORICAL_RATE_FLOOR = 0.2


@dataclass(frozen=True)
class SleepingBeautyParams:
    min_dormancy_years: int = 3
    min_recent_citations: int = 2
    min_score: float = 1.5


def calculate_awakening_score(
    recent_citations: int,
    window_days: int,
    all_time_citations: int,
    publication_year: int,
    current_year: int,
) -> float:
    age = current_year - publication_year
    if age < 1 or window_days < 1:
        return 0.0
    prior = max(0, all_time_citations - recent_citations)
    historical_rate = max(HISTORICAL_RATE_FLOOR, prior / age)
    recent_rate = recent_citations * 365.0 / window_days
    return round(math.log10(recent_rate / historical_rate + 1.0) * math.sqrt(age), 2)


def is_sleeping_beauty(
    recent_citations: int,
    window_days: int,
    all_time_citations: Optional[int],
    publication_year: Optional[int],
    current_year: int,
    params: SleepingBeautyParams = SleepingBeautyParams(),
) -> Optional[float]:
    """Returns the awakening score if the work qualifies, otherwise None."""
    if publication_year is None or all_time_citations is None:
        return None
    if current_year - publication_year < params.min_dormancy_years:
        return None
    if recent_citations < params.min_recent_citations:
        return None
    score = calculate_awakening_score(
        recent_citations, window_days, all_time_citations, publication_year, current_year
    )
    return score if score >= params.min_score else None
