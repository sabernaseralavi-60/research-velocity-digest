"""
Lexical text similarity (TF-IDF + cosine), pure Python.

This is *lexical* similarity: it rewards shared vocabulary. It is not a semantic embedding and the
product labels it that way. Embeddings can replace `rank_against` later without touching callers.
"""

import math
import re
from collections import Counter
from typing import Dict, List

_STOP = frozenset(
    """a an and are as at be been but by can for from has have in into is it its of on or such that the their
    then there these they this to was we were which will with within without using use used based via we our
    also than more most not may paper study results method methods approach new show shown propose proposed""".split()
)
_TOKEN = re.compile(r"[a-z0-9][a-z0-9\-]{2,}")


def tokenize(text: str) -> List[str]:
    tokens = []
    for tok in _TOKEN.findall((text or "").lower()):
        if tok in _STOP:
            continue
        if len(tok) > 4 and tok.endswith("s") and not tok.endswith("ss"):
            tok = tok[:-1]  # crude plural folding: "measures" -> "measure"
        tokens.append(tok)
    return tokens


def _idf(docs_tokens: List[List[str]]) -> Dict[str, float]:
    n = len(docs_tokens)
    df: Counter = Counter()
    for toks in docs_tokens:
        df.update(set(toks))
    return {t: math.log((1 + n) / (1 + c)) + 1.0 for t, c in df.items()}


def _vector(tokens: List[str], idf: Dict[str, float]) -> Dict[str, float]:
    tf = Counter(tokens)
    return {t: (1 + math.log(c)) * idf.get(t, 1.0) for t, c in tf.items()}


def _cosine(a: Dict[str, float], b: Dict[str, float]) -> float:
    if not a or not b:
        return 0.0
    if len(a) > len(b):
        a, b = b, a
    dot = sum(v * b.get(t, 0.0) for t, v in a.items())
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def rank_against(query_text: str, docs: List[str]) -> List[float]:
    """Cosine similarity of every doc to the query, with IDF computed over docs + query."""
    q_tokens = tokenize(query_text)
    d_tokens = [tokenize(d) for d in docs]
    idf = _idf(d_tokens + [q_tokens])
    q_vec = _vector(q_tokens, idf)
    return [_cosine(q_vec, _vector(t, idf)) for t in d_tokens]
