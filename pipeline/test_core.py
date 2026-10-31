"""
Offline tests for the database-backed core. Expected numbers are computed by hand (comments show the
arithmetic), never taken from the code under test.
"""

import math
import unittest
import urllib.error
from datetime import datetime, timezone
from unittest import mock

from pipeline.config import PipelineConfig
from pipeline.fetcher import OpenAlexClient, search_filter
from pipeline.insights import compute_topic_insights
from pipeline.latent_gems import LatentGemParams, latent_potential_score, passes_stagnation_filter
from pipeline.mailer import EmailDispatcher
from pipeline.models import PipelineReport, RecentPaper, TrendingPaper
from pipeline.scholar import generate_scholar_url
from pipeline.sleeping_beauty import calculate_awakening_score, is_sleeping_beauty
from pipeline.store import Store
from pipeline.textsim import rank_against, tokenize

TODAY = datetime(2026, 10, 31, tzinfo=timezone.utc)


def paper(pid, date, refs, title="T"):
    return RecentPaper(id=f"https://openalex.org/{pid}", title=title, publication_date=date, publication_year=int(date[:4]),
                       primary_topic="X", authors=["A"], referenced_works=[f"https://openalex.org/{r}" for r in refs])


class TestScores(unittest.TestCase):
    def test_awakening_hand_calculation(self):
        # age 10, prior 81 -> 8.1/yr; recent 4 in 7 days -> 4*365/7 = 208.571/yr
        # ratio 25.749; log10(26.749) = 1.42733; * sqrt(10) = 3.16228 -> 4.51
        self.assertEqual(calculate_awakening_score(4, 7, 85, 2016, 2026), 4.51)

    def test_famous_paper_is_not_a_sleeping_beauty(self):
        # 200k citations over 10 years: historical rate ~20k/yr, recent 6 in 7 days = 313/yr -> ratio 0.0156
        self.assertIsNone(is_sleeping_beauty(6, 7, 200_000, 2016, 2026))

    def test_new_paper_is_never_dormant(self):
        self.assertIsNone(is_sleeping_beauty(10, 7, 12, 2025, 2026))

    def test_zero_history_uses_floor(self):
        # prior 0 -> floor 0.2/yr; recent 2 in 30 days = 24.333/yr; ratio 121.67; log10(122.67)=2.0887; sqrt(9)=3 -> 6.27
        self.assertEqual(calculate_awakening_score(2, 30, 2, 2017, 2026), 6.27)

    def test_latent_potential_hand_calculation(self):
        # sim 0.5, 14 citations, age 16, evidence 1: 0.5**1.3 = 0.40613; log10(17) = 1.23045;
        # obscurity 1/log2(16) = 0.25; (1+log10(1)) = 1; *15 -> 0.40613*1.23045*0.25*15 = 1.874
        self.assertEqual(latent_potential_score(0.5, 14, 16, 1), 1.87)

    def test_more_evidence_raises_score_and_more_citations_lower_it(self):
        base = latent_potential_score(0.3, 10, 12, 1)
        self.assertGreater(latent_potential_score(0.3, 10, 12, 4), base)
        self.assertLess(latent_potential_score(0.3, 40, 12, 1), base)

    def test_stagnation_filter_bounds(self):
        p = LatentGemParams()
        self.assertTrue(passes_stagnation_filter(2016, 50, 2026, p))  # age 10, 50 citations: on the edge, kept
        self.assertFalse(passes_stagnation_filter(2016, 51, 2026, p))
        self.assertFalse(passes_stagnation_filter(2019, 5, 2026, p))  # age 7 < 8
        self.assertFalse(passes_stagnation_filter(1985, 5, 2026, p))  # age 41 > 35


class TestText(unittest.TestCase):
    def test_tokenize_folds_plurals_and_drops_stopwords(self):
        self.assertEqual(tokenize("The Safety Measures of the Traffic"), ["safety", "measure", "traffic"])

    def test_related_text_ranks_above_unrelated(self):
        sims = rank_against("traffic conflict safety measures", ["traffic conflict detection at intersections", "protein folding in yeast"])
        self.assertGreater(sims[0], sims[1])
        self.assertEqual(sims[1], 0.0)

    def test_scholar_url_has_single_quotes_around_a_quoted_title(self):
        url = generate_scholar_url('"Why Should I Trust You?"', "Ribeiro", 2016)
        self.assertIn("q=%22Why+Should+I+Trust+You%3F%22", url)
        self.assertNotIn("%22%22", url)


class TestStore(unittest.TestCase):
    def setUp(self):
        self.s = Store(":memory:")
        self.addCleanup(self.s.close)
        self.s.upsert_topic("T", "t", topic_id="t")

    def test_save_is_idempotent_and_counts_distinct_citers(self):
        papers = [paper("W1", "2026-10-30", ["R1", "R2"]), paper("W2", "2026-10-30", ["R1"]), paper("W3", "2026-10-01", ["R1"])]
        self.assertEqual(self.s.save_papers("t", papers), (3, 4))
        self.assertEqual(self.s.save_papers("t", papers), (0, 0))  # same day again: nothing double counted
        self.assertEqual(self.s.velocity("t", "2026-10-24"), [("R1", 2), ("R2", 1)])  # W3 is outside the window
        self.assertEqual(self.s.velocity("t", "2026-09-01")[0], ("R1", 3))

    def test_duplicate_reference_inside_one_paper_counts_once(self):
        self.s.save_papers("t", [paper("W1", "2026-10-30", ["R1", "R1", "R1"])])
        self.assertEqual(self.s.velocity("t", "2026-10-01"), [("R1", 1)])

    def test_topics_are_isolated(self):
        self.s.upsert_topic("U", "u", topic_id="u")
        self.s.save_papers("t", [paper("W1", "2026-10-30", ["R1"])])
        self.s.save_papers("u", [paper("W2", "2026-10-30", ["R9"])])
        self.assertEqual(self.s.velocity("u", "2026-10-01"), [("R9", 1)])

    def test_deactivated_topic_is_not_listed(self):
        self.s.deactivate_topic("t")
        self.assertEqual(self.s.list_topics(), [])
        self.assertEqual(len(self.s.list_topics(active_only=False)), 1)

    def test_empty_database_is_handled(self):
        self.assertEqual(self.s.velocity("t", "2026-01-01"), [])
        self.assertEqual(self.s.topic_window_stats("t", "2026-01-01"), {"papers": 0, "edges": 0, "unique_cited": 0})
        self.assertEqual(self.s.totals()["papers"], 0)


class FakeClient:
    """Stands in for OpenAlex: hydrate returns scripted works."""
    last_truncated = False

    def __init__(self, works):
        self.works = works
        self.requested = []

    def hydrate_papers_batch(self, ids):
        self.requested.extend(ids)
        return [self.works[i] for i in ids if i in self.works]


def work(wid, year, cites, title, abstract=None):
    return {"id": f"https://openalex.org/{wid}", "title": title, "publication_year": year, "cited_by_count": cites,
            "authorships": [{"author": {"display_name": "Au"}}], "primary_topic": {"display_name": "Topic", "subfield": {"display_name": "Sub"}},
            "doi": None, "abstract_inverted_index": ({w: [i] for i, w in enumerate(abstract.split())} if abstract else None)}


class TestInsights(unittest.TestCase):
    def test_all_three_indices_from_the_database(self):
        s = Store(":memory:")
        tid = s.upsert_topic("Traffic conflict", "traffic conflict safety", topic_id="tc")
        # six recent papers (all inside 7 days); references: FAMOUS x6, SLEEPER x3, GEM x2, NOISE x1
        refs = {
            "P1": ["FAMOUS", "SLEEPER", "GEM", "NOISE"], "P2": ["FAMOUS", "SLEEPER", "GEM"], "P3": ["FAMOUS", "SLEEPER"],
            "P4": ["FAMOUS"], "P5": ["FAMOUS"], "P6": ["FAMOUS"],
        }
        s.save_papers(tid, [paper(k, "2026-10-29", v, title=f"traffic conflict safety study {k}") for k, v in refs.items()])
        client = FakeClient({
            "FAMOUS": work("FAMOUS", 2016, 200_000, "Deep Residual Learning"),
            "SLEEPER": work("SLEEPER", 2016, 85, "Old forgotten method", "a forgotten method"),
            "GEM": work("GEM", 2008, 6, "Traffic conflict safety extreme value theory", "traffic conflict safety rare event extreme value"),
            "NOISE": work("NOISE", 2025, 3, "New unrelated"),
        })
        cfg = PipelineConfig(min_citation_velocity=3, top_n_papers=10)
        summary = compute_topic_insights(s, client, s.list_topics()[0], cfg, today=TODAY, windows=(7,))
        snap = s.get_snapshot("insights", "tc", 7)
        self.assertEqual(snap["stats"]["recent_papers_scanned"], 6)
        self.assertEqual(snap["stats"]["unique_works_cited"], 4)
        # velocity >= 3: FAMOUS (6) and SLEEPER (3); GEM has only 2 -> fallback not needed? only 2 works pass
        ids = [t["id"] for t in snap["trending"]]
        self.assertEqual(ids[0], "FAMOUS")
        self.assertEqual(snap["trending"][0]["recent_citation_velocity"], 6)
        # SLEEPER: age 10, prior 82 -> 8.2/yr; recent 3 in 7d = 156.43/yr; ratio 19.077;
        # log10(20.077) = 1.30269; * sqrt(10) = 3.16228 -> 4.119
        sleepers = {t["id"]: t for t in snap["sleeping_beauties"]}
        self.assertIn("SLEEPER", sleepers)
        self.assertNotIn("FAMOUS", sleepers)
        self.assertAlmostEqual(sleepers["SLEEPER"]["awakening_score"], 4.12, places=2)
        # GEM: age 18, 6 citations, lexically close to the topic -> the only latent gem
        gems = {t["id"]: t for t in snap["latent_gems"]}
        self.assertEqual(list(gems), ["GEM"])
        self.assertEqual(gems["GEM"]["recent_topic_papers_citing"], 2)
        self.assertEqual(snap["methods"]["similarity"], "lexical TF-IDF cosine (not a semantic embedding)")
        self.assertEqual(summary["windows"][7]["gems"], 1)

    def test_threshold_fallback_never_shows_single_citation_works(self):
        s = Store(":memory:")
        tid = s.upsert_topic("T", "t", topic_id="t")
        s.save_papers(tid, [paper("P1", "2026-10-29", ["A", "B"]), paper("P2", "2026-10-29", ["A"])])
        client = FakeClient({"A": work("A", 2020, 10, "Aaa"), "B": work("B", 2020, 10, "Bbb")})
        compute_topic_insights(s, client, s.list_topics()[0], PipelineConfig(min_citation_velocity=5), today=TODAY, windows=(7,))
        snap = s.get_snapshot("insights", "t", 7)
        self.assertTrue(snap["stats"]["threshold_fallback"])
        self.assertEqual([t["id"] for t in snap["trending"]], ["A"])  # B was cited once: not trending

    def test_empty_topic_produces_an_empty_snapshot(self):
        s = Store(":memory:")
        s.upsert_topic("T", "t", topic_id="t")
        compute_topic_insights(s, FakeClient({}), s.list_topics()[0], PipelineConfig(), today=TODAY, windows=(7,))
        snap = s.get_snapshot("insights", "t", 7)
        self.assertEqual((snap["trending"], snap["sleeping_beauties"], snap["latent_gems"]), ([], [], []))


class TestFetcher(unittest.TestCase):
    def client(self):
        return OpenAlexClient(PipelineConfig(polite_email=""), sleep=lambda _s: None)

    def page(self, ids, nxt):
        return {"results": [{"id": f"https://openalex.org/{i}", "title": i, "publication_date": "2026-10-30", "publication_year": 2026,
                             "referenced_works": ["https://openalex.org/R1"], "authorships": [], "primary_topic": None, "doi": None} for i in ids],
                "meta": {"next_cursor": nxt}}

    def test_cursor_pagination_collects_every_page(self):
        c = self.client()
        pages = [self.page(["a", "b"], "c1"), self.page(["c"], None)]
        with mock.patch.object(c, "_make_request", side_effect=pages):
            got = list(c.iter_recent_papers("concepts.id:X", TODAY, TODAY, cap=100))
        self.assertEqual([p.title for p in got], ["a", "b", "c"])
        self.assertFalse(c.last_truncated)

    def test_cap_sets_truncated_flag(self):
        c = self.client()
        with mock.patch.object(c, "_make_request", side_effect=[self.page(["a", "b", "c"], "c1")]):
            got = list(c.iter_recent_papers("concepts.id:X", TODAY, TODAY, cap=2))
        self.assertEqual(len(got), 2)
        self.assertTrue(c.last_truncated)

    def test_429_is_retried_and_404_is_not(self):
        c = self.client()
        err429 = urllib.error.HTTPError("u", 429, "Too Many", {"Retry-After": "2"}, None)
        ok = mock.MagicMock()
        ok.__enter__.return_value.read.return_value = b'{"results": []}'
        with mock.patch("urllib.request.urlopen", side_effect=[err429, ok]) as m:
            self.assertEqual(c._make_request("http://x"), {"results": []})
            self.assertEqual(m.call_count, 2)
        err404 = urllib.error.HTTPError("u", 404, "Not Found", {}, None)
        with mock.patch("urllib.request.urlopen", side_effect=[err404]) as m:
            with self.assertRaises(RuntimeError):
                c._make_request("http://x")
            self.assertEqual(m.call_count, 1)

    def test_search_filter_keeps_boolean_query(self):
        self.assertEqual(search_filter('"surrogate safety" OR "traffic conflict"'), 'title_and_abstract.search:"surrogate safety" OR "traffic conflict"')


class TestMailerEscaping(unittest.TestCase):
    def test_hostile_title_is_escaped_in_both_renderers(self):
        evil = '<script>alert(1)</script>'
        tp = TrendingPaper(id="W1", title=evil, authors=[evil], publication_year=2026, primary_topic=evil, subfield="s",
                           recent_citation_velocity=5, all_time_citations=9, velocity_ratio_percent=50,
                           scholar_url='https://x/?q="><script>', openalex_url="https://openalex.org/W1", abstract=evil)
        report = PipelineReport(lookback_days=7, start_date="a", end_date="b", recent_papers_scanned=1, total_references_extracted=1,
                                unique_works_cited=1, trending_threshold=1, trending_papers=[tp], execution_time_seconds=0.1, subfields_covered=[])
        d = EmailDispatcher(PipelineConfig())
        self.assertNotIn("<script>", d._render_fallback_html(report))
        self.assertNotIn("<script>", d.render_html(report))


if __name__ == "__main__":
    unittest.main()
