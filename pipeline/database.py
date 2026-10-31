"""
SQLite / PostgreSQL Persistence Layer for Daily Inverted Citation Pipeline.
Supports continuous daily graph growth, citation velocity tracking,
and dormant paper semantic metadata storage.
"""

import sqlite3
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger("Database")

DEFAULT_DB_PATH = Path("output/research_velocity.db")


class ResearchDatabase:
    def __init__(self, db_path = DEFAULT_DB_PATH):
        if str(db_path) == ":memory:":
            self.db_path = ":memory:"
        else:
            self.db_path = Path(db_path)
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Initializes relational tables with proper indexes for fast inverted lookups."""
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # 1. Monitored User Topics / Google Scholar Labels
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword TEXT UNIQUE NOT NULL,
                domain TEXT DEFAULT 'transportation',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # 2. Ingested New Papers (The Observers)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS ingested_papers (
                work_id TEXT PRIMARY KEY,
                title TEXT,
                publication_date TEXT,
                publication_year INTEGER,
                primary_topic TEXT,
                authors_json TEXT,
                doi TEXT,
                ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # 3. Citation Graph Edges (Observer -> Cited Work)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS citation_edges (
                source_work_id TEXT,
                target_work_id TEXT,
                edge_date TEXT,
                PRIMARY KEY (source_work_id, target_work_id),
                FOREIGN KEY (source_work_id) REFERENCES ingested_papers(work_id)
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_target ON citation_edges(target_work_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_edge_date ON citation_edges(edge_date)")

            # 4. Cataloged Works (Metadata for cited & candidate papers)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS works_catalog (
                work_id TEXT PRIMARY KEY,
                title TEXT,
                authors_json TEXT,
                publication_year INTEGER,
                all_time_citations INTEGER DEFAULT 0,
                doi TEXT,
                abstract TEXT,
                primary_topic TEXT,
                semantic_embedding_json TEXT,
                latent_potential_score REAL DEFAULT 0.0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_pub_year ON works_catalog(publication_year)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_potential ON works_catalog(latent_potential_score)")

            conn.commit()

    def save_paper_and_citations(self, paper: Dict[str, Any], referenced_work_ids: List[str]):
        """Persists an ingested paper and records all its reference edges."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            work_id = paper["id"].split("/")[-1]

            cursor.execute("""
            INSERT OR REPLACE INTO ingested_papers 
            (work_id, title, publication_date, publication_year, primary_topic, authors_json, doi)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                work_id,
                paper.get("title", "Untitled"),
                paper.get("publication_date", ""),
                paper.get("publication_year", 2026),
                paper.get("primary_topic", {}).get("display_name", "General"),
                json.dumps([a.get("author", {}).get("display_name", "") for a in paper.get("authorships", [])]),
                paper.get("doi", "")
            ))

            for ref_id in set(referenced_work_ids):
                clean_ref = ref_id.split("/")[-1]
                cursor.execute("""
                INSERT OR IGNORE INTO citation_edges (source_work_id, target_work_id, edge_date)
                VALUES (?, ?, ?)
                """, (work_id, clean_ref, paper.get("publication_date", "")))

            conn.commit()

    def get_velocity_in_window(self, days: int = 7) -> List[Dict[str, Any]]:
        """Calculates citation counts accumulated strictly within the last N days."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            query = """
            SELECT 
                target_work_id, 
                COUNT(*) as recent_velocity,
                COUNT(DISTINCT source_work_id) as unique_citers
            FROM citation_edges
            WHERE edge_date >= date('now', ?)
            GROUP BY target_work_id
            ORDER BY recent_velocity DESC
            LIMIT 100
            """
            cursor.execute(query, (f"-{days} days",))
            return [dict(row) for row in cursor.fetchall()]

    def get_user_topics(self) -> List[str]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT keyword FROM user_topics WHERE is_active = 1")
            rows = cursor.fetchall()
            return [r["keyword"] for r in rows]

    def add_user_topic(self, keyword: str, domain: str = "transportation"):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT OR IGNORE INTO user_topics (keyword, domain) VALUES (?, ?)", (keyword.strip(), domain))
            conn.commit()
