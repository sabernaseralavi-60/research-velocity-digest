"""
Unit test suite for AI Research Velocity Digest (Python standard unittest).
"""

import unittest
from pipeline.scholar import generate_scholar_url, sanitize_paper_title, reconstruct_abstract_inverted_index
from pipeline.models import RecentPaper
from pipeline.config import PipelineConfig
from collections import Counter


class TestScholarUtils(unittest.TestCase):
    def test_sanitize_paper_title(self):
        title = "  <b>Deep Residual Learning</b> for Image Recognition...  "
        cleaned = sanitize_paper_title(title)
        self.assertEqual(cleaned, "Deep Residual Learning for Image Recognition")

    def test_generate_scholar_url_quoting(self):
        url = generate_scholar_url("Attention Is All You Need", "Vaswani", 2017)
        self.assertTrue(url.startswith("https://scholar.google.com/scholar"))
        self.assertIn("q=%22Attention+Is+All+You+Need%22", url)
        self.assertIn("as_ylo=2017", url)

    def test_reconstruct_abstract(self):
        index = {"Large": [0], "language": [1], "models": [2], "excel": [3]}
        reconstructed = reconstruct_abstract_inverted_index(index)
        self.assertEqual(reconstructed, "Large language models excel")


class TestInvertedIndexing(unittest.TestCase):
    def test_counter_aggregation(self):
        papers = [
            RecentPaper(
                id="P1",
                title="Paper 1",
                publication_date="2026-10-25",
                publication_year=2026,
                primary_topic="AI",
                authors=["Alice"],
                referenced_works=["W_LORA", "W_TRANSFORMER", "W_RESNET"],
            ),
            RecentPaper(
                id="P2",
                title="Paper 2",
                publication_date="2026-10-26",
                publication_year=2026,
                primary_topic="Vision",
                authors=["Bob"],
                referenced_works=["W_LORA", "W_CLIP", "W_TRANSFORMER"],
            ),
            RecentPaper(
                id="P3",
                title="Paper 3",
                publication_date="2026-10-27",
                publication_year=2026,
                primary_topic="ML",
                authors=["Charlie"],
                referenced_works=["W_LORA", "W_DIFFUSION"],
            ),
        ]

        counter = Counter()
        for p in papers:
            for ref in set(p.referenced_works):
                counter[ref] += 1

        self.assertEqual(counter["W_LORA"], 3)
        self.assertEqual(counter["W_TRANSFORMER"], 2)
        self.assertEqual(counter["W_CLIP"], 1)

        # Filter with threshold >= 2
        trending = [k for k, v in counter.items() if v >= 2]
        self.assertIn("W_LORA", trending)
        self.assertIn("W_TRANSFORMER", trending)
        self.assertNotIn("W_CLIP", trending)


if __name__ == "__main__":
    unittest.main()
