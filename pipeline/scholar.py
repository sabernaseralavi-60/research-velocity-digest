"""
Google Scholar Link Generation and Metadata Sanitization Module.
"""

import re
import urllib.parse
from typing import Optional


def sanitize_paper_title(title: str) -> str:
    """
    Cleans up paper titles for search querying:
    - Strips HTML markup (<p>, <i>, <b>, etc.)
    - Normalizes multi-line whitespace
    - Removes trailing punctuation and ellipsis
    - Preserves internal acronyms and technical keywords
    """
    if not title:
        return ""
    # Strip HTML tags
    cleaned = re.sub(r"<[^>]+>", "", title)
    # Remove math mode LaTeX markers
    cleaned = re.sub(r"\$([^$]+)\$", r"\1", cleaned)
    # Replace non-breaking spaces and linebreaks
    cleaned = re.sub(r"[\r\n\t]+", " ", cleaned).strip()
    # Quote characters would break the exact-phrase query ("" around a quoted title)
    cleaned = re.sub(r'["“”]', "", cleaned).strip()
    # Strip trailing punctuation, periods, ellipsis
    cleaned = re.sub(r"(\.{3,}|[.,:;…]+)$", "", cleaned).strip()
    return cleaned


def generate_scholar_url(
    title: str,
    first_author: Optional[str] = None,
    publication_year: Optional[int] = None,
) -> str:
    """
    Builds a targeted direct Google Scholar search URL.
    Uses exact phrase matching via quotation marks around the paper title,
    which lands the user directly on the Scholar paper entry or its citations.

    Example Output:
    https://scholar.google.com/scholar?q=%22Attention+Is+All+You+Need%22&as_ylo=2017
    """
    cleaned_title = sanitize_paper_title(title)
    if not cleaned_title:
        return "https://scholar.google.com"

    # Truncate overly verbose titles to keep URL within browser safe limits
    if len(cleaned_title) > 200:
        cleaned_title = cleaned_title[:197] + "..."

    # Exact phrase search in Google Scholar
    params = {
        "q": f'"{cleaned_title}"'
    }

    if publication_year and 1950 <= publication_year <= 2030:
        params["as_ylo"] = str(publication_year)

    return f"https://scholar.google.com/scholar?{urllib.parse.urlencode(params)}"


def reconstruct_abstract_inverted_index(inverted_index: Optional[dict]) -> str:
    """
    Reconstructs continuous text from OpenAlex's abstract_inverted_index format.
    Format: {"word": [pos1, pos2]} -> ordered string.
    """
    if not inverted_index or not isinstance(inverted_index, dict):
        return ""

    words_with_positions = []
    for word, positions in inverted_index.items():
        if isinstance(positions, list):
            for pos in positions:
                words_with_positions.append((pos, word))

    words_with_positions.sort(key=lambda x: x[0])
    return " ".join(word for _, word in words_with_positions)
