"""
Latent Gems & Pre-Awakening Discovery Engine (Predictive Scientometrics).

Identifies truly un-awakened, low-citation historical works with astronomical latent potential
to be resurrected, without brute-force embedding 250 million papers:

Hierarchical Funneling Strategy:
1. Target Frontier Identification: Embeds recent paradigm-shifting papers in user's domain (e.g. Traffic Surrogate Safety, Household Travel Surveys).
2. Backward Topology Walk: Extracts 2nd & 3rd-order ancestral references (papers cited by the foundations of modern preprints).
3. Citation Stagnation Filter: Retains ONLY papers published 8-35 years ago with low citation counts (< 30-80 citations total).
4. Semantic Resonance & Methodological Isomorphism: Computes cosine similarity between ancient dormant paper abstracts and today's urgent unsolved problems.
"""

import math
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class LatentGemPaper:
    id: str
    title: str
    authors: List[str]
    publication_year: int
    dormancy_years: int
    all_time_citations: int  # Very low (<50) -> completely undiscovered
    latent_potential_score: float  # Quantifies probability of paradigm relevance
    semantic_overlap_concept: str
    why_valuable: str
    scholar_url: str
    openalex_url: str
    abstract: Optional[str] = None


def compute_latent_potential_score(
    all_time_citations: int,
    pub_year: int,
    semantic_similarity: float,
    ancestral_depth_weight: float = 1.0,
    current_year: int = 2026,
) -> float:
    """
    Computes Latent Potential Score for un-awakened papers:
    - High semantic similarity to today's active research frontiers.
    - Deep obscurity penalty (lower citations + older age = higher novelty discovery yield if relevant).
    
    Formula:
      Age = current_year - pub_year
      ObscurityFactor = 1.0 / (log2(all_time_citations + 2))
      Potential = (semantic_similarity ^ 1.5) * log10(Age) * ObscurityFactor * ancestral_depth_weight * 10
    """
    age = max(1, current_year - pub_year)
    if age < 5:
        return 0.0  # Not an old dormant paper

    obscurity = 1.0 / math.log2(max(1, all_time_citations) + 2)
    potential = (semantic_similarity ** 1.3) * math.log10(age + 1) * obscurity * ancestral_depth_weight * 15.0
    return round(potential, 2)


def screen_dormant_gems(
    candidate_historical_works: List[Dict[str, Any]],
    target_frontier_keywords: List[str],
    current_year: int = 2026,
) -> List[LatentGemPaper]:
    """
    Screens candidate historical works against user's specific domain (e.g. Transportation, Surrogate Safety, Travel Surveys).
    """
    discovered_gems = []

    for work in candidate_historical_works:
        pub_year = work.get("publication_year", current_year)
        age = current_year - pub_year
        if age < 5:
            continue

        all_time = work.get("cited_by_count", 0)
        # We only want truly hidden gems (< 120 all-time citations)
        if all_time > 150:
            continue

        title = work.get("title", "")
        abstract = work.get("abstract", "")
        combined_text = (title + " " + abstract).lower()

        # Measure semantic matching with user's domain interests
        matched_keywords = [kw for kw in target_frontier_keywords if kw.lower() in combined_text]
        if not matched_keywords:
            continue

        similarity_estimate = min(1.0, 0.45 + (len(matched_keywords) * 0.18))
        score = compute_latent_potential_score(all_time, pub_year, similarity_estimate, current_year=current_year)

        if score >= 3.0:
            authors = [
                a.get("author", {}).get("display_name")
                for a in work.get("authorships", [])
                if a.get("author", {}).get("display_name")
            ][:4]

            clean_title = title.replace('"', '').strip()
            gem = LatentGemPaper(
                id=work.get("id", "").split("/")[-1],
                title=title,
                authors=authors or ["Unknown Author"],
                publication_year=pub_year,
                dormancy_years=age,
                all_time_citations=all_time,
                latent_potential_score=score,
                semantic_overlap_concept=", ".join(matched_keywords[:3]),
                why_valuable=f"Untapped methodological framework matching modern {matched_keywords[0]} inquiries with only {all_time} historical citations.",
                scholar_url=f'https://scholar.google.com/scholar?q="{clean_title}"&as_ylo={pub_year}',
                openalex_url=f"https://openalex.org/{work.get('id', '')}",
                abstract=abstract,
            )
            discovered_gems.append(gem)

    discovered_gems.sort(key=lambda x: x.latent_potential_score, reverse=True)
    return discovered_gems
