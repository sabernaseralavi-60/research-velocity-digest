"""
Pre-awakening latent gems: old, barely cited works that the newest papers of a topic already cite.

Funnel (cheap to expensive, so nothing is embedded for hundreds of thousands of papers):
  1. frontier   - recent papers of the topic (in the database)
  2. ancestors  - works those papers cite (1 hop; 2-3 hop walks are future work, see TRACE R-D3)
  3. stagnation - age between min_age and max_age years and at most max_citations citations
  4. relevance  - lexical TF-IDF cosine between the candidate (title + abstract) and the topic profile
                  (the topic query + titles of the recent papers that cite the candidate)

potential = similarity**1.3 * log10(age + 1) * obscurity * (1 + log10(evidence)) * 15
  obscurity = 1 / log2(citations + 2);  evidence = number of distinct recent topic papers citing it
Ranking heuristic from the owner's spec, not calibrated against ground truth.
"""

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class LatentGemParams:
    min_age: int = 8
    max_age: int = 35
    max_citations: int = 50
    min_similarity: float = 0.08
    # The score only RANKS candidates (it is not a probability); lexical cosines of short texts are small
    # (observed 0.08-0.16 on real data), so no absolute score cut-off is applied: the top-K are shown.
    min_score: float = 0.0


def latent_potential_score(similarity: float, citations: int, age: int, evidence: int) -> float:
    if similarity <= 0 or age < 1 or evidence < 1:
        return 0.0
    obscurity = 1.0 / math.log2(max(0, citations) + 2)
    return round(
        (similarity ** 1.3) * math.log10(age + 1) * obscurity * (1.0 + math.log10(evidence)) * 15.0, 2
    )


def passes_stagnation_filter(
    publication_year: int, citations: int, current_year: int, params: LatentGemParams = LatentGemParams()
) -> bool:
    age = current_year - publication_year
    return params.min_age <= age <= params.max_age and citations <= params.max_citations
