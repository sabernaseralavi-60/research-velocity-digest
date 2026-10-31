"""
Builds a SMALL FIXTURE database for the browser tests (CI): every title starts with "Fixture" so it can never
be mistaken for real data. It goes through the real pipeline code (store + insights); only OpenAlex is faked.

    python scripts/make_fixture_db.py output/e2e.db
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline.config import PipelineConfig  # noqa: E402
from pipeline.insights import compute_topic_insights  # noqa: E402
from pipeline.models import RecentPaper  # noqa: E402
from pipeline.store import Store  # noqa: E402


class FixtureClient:
    last_truncated = False

    def __init__(self, works):
        self.works = works

    def hydrate_papers_batch(self, ids):
        return [self.works[i] for i in ids if i in self.works]


def work(wid, year, cites, title, abstract=""):
    return {
        "id": f"https://openalex.org/{wid}", "title": title, "publication_year": year, "cited_by_count": cites,
        "authorships": [{"author": {"display_name": "Fixture Author"}}],
        "primary_topic": {"display_name": "Fixture topic", "subfield": {"display_name": "Fixture subfield"}},
        "doi": None, "abstract_inverted_index": {w: [i] for i, w in enumerate(abstract.split())} if abstract else None,
    }


def main(path: str) -> None:
    db = Path(path)
    if db.exists():
        db.unlink()
    store = Store(str(db))
    today = datetime.now(timezone.utc)
    day = lambda n: (today - timedelta(days=n)).strftime("%Y-%m-%d")  # noqa: E731

    store.upsert_topic("AI / ML / Computer Vision (broad)", "AI", kind="concepts", hydrate_all=False, topic_id="ai-research")
    store.upsert_topic("Surrogate safety measures", "traffic conflict safety measures", topic_id="surrogate-safety-measures")

    def paper(pid, n, refs, title):
        return RecentPaper(id=f"https://openalex.org/{pid}", title=title, publication_date=day(n), publication_year=today.year,
                           primary_topic="Fixture", authors=["Fixture Author"], referenced_works=[f"https://openalex.org/{r}" for r in refs])

    store.save_papers("ai-research", [
        paper(f"FA{i}", i % 5, ["FHOT1", "FHOT2"] + (["FSLEEP"] if i < 4 else []), f"Fixture recent AI paper {i}") for i in range(8)
    ])
    store.save_papers("surrogate-safety-measures", [
        paper(f"FS{i}", i * 3, ["FHOT1", "FGEM"] + (["FSLEEP"] if i < 3 else []), f"Fixture traffic conflict safety study {i}") for i in range(6)
    ])
    works = {
        "FHOT1": work("FHOT1", today.year - 2, 900, "Fixture hot method"),
        "FHOT2": work("FHOT2", today.year - 1, 50, "Fixture second hot method"),
        "FSLEEP": work("FSLEEP", today.year - 12, 70, "Fixture forgotten method revived", "a forgotten method for traffic safety"),
        "FGEM": work("FGEM", today.year - 20, 6, "Fixture traffic conflict safety extreme value theory",
                     "traffic conflict safety rare event extreme value theory for measures"),
    }
    cfg = PipelineConfig(min_citation_velocity=3, top_n_papers=10)
    for topic in store.list_topics():
        compute_topic_insights(store, FixtureClient(works), topic, cfg, today=today)
    print(f"fixture database written to {db}: {store.totals()}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "output/e2e.db")
