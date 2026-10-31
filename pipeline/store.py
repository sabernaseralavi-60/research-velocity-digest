"""
Persistence layer: the citation database that grows every day.

One portable schema for SQLite (local, tests) and PostgreSQL (Neon, production). Dates are ISO text
(YYYY-MM-DD) so the same SQL works on both. Writes are idempotent (ON CONFLICT), so re-running a day
never double counts an edge.
"""

import json
import logging
import re
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from .models import RecentPaper

logger = logging.getLogger("Store")

DEFAULT_SQLITE_PATH = "output/research_velocity.db"

SCHEMA = [
    """CREATE TABLE IF NOT EXISTS topics (
        topic_id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        query TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'search',
        hydrate_all INTEGER NOT NULL DEFAULT 1,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS papers (
        work_id TEXT PRIMARY KEY,
        title TEXT,
        publication_date TEXT,
        publication_year INTEGER,
        primary_topic TEXT,
        doi TEXT,
        first_seen TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS paper_topics (
        work_id TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        PRIMARY KEY (work_id, topic_id)
    )""",
    """CREATE TABLE IF NOT EXISTS edges (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        edge_date TEXT NOT NULL,
        PRIMARY KEY (source_id, target_id)
    )""",
    "CREATE INDEX IF NOT EXISTS idx_edges_target ON edges (target_id)",
    "CREATE INDEX IF NOT EXISTS idx_edges_date ON edges (edge_date)",
    "CREATE INDEX IF NOT EXISTS idx_paper_topics_topic ON paper_topics (topic_id)",
    """CREATE TABLE IF NOT EXISTS works (
        work_id TEXT PRIMARY KEY,
        title TEXT,
        publication_year INTEGER,
        cited_by_count INTEGER,
        authors TEXT,
        abstract TEXT,
        doi TEXT,
        primary_topic TEXT,
        subfield TEXT,
        fetched_at TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS snapshots (
        kind TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        window_days INTEGER NOT NULL,
        computed_at TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (kind, topic_id, window_days)
    )""",
    """CREATE TABLE IF NOT EXISTS runs (
        run_id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        status TEXT NOT NULL,
        papers_seen INTEGER DEFAULT 0,
        papers_new INTEGER DEFAULT 0,
        edges_new INTEGER DEFAULT 0,
        truncated INTEGER DEFAULT 0,
        error TEXT
    )""",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slugify(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    return slug[:60] or "topic"


def short_id(work_id: str) -> str:
    """https://openalex.org/W123 -> W123"""
    return (work_id or "").rsplit("/", 1)[-1]


class Store:
    def __init__(self, url: Optional[str] = None):
        url = (url or "").strip()
        self.is_pg = url.startswith(("postgres://", "postgresql://"))
        if self.is_pg:
            import psycopg  # imported lazily: SQLite use needs no Postgres driver

            self._conn = psycopg.connect(url)
        else:
            path = url or DEFAULT_SQLITE_PATH
            if path != ":memory:":
                Path(path).parent.mkdir(parents=True, exist_ok=True)
            self._conn = sqlite3.connect(path)
            self._conn.row_factory = sqlite3.Row
        self.ensure_schema()

    # ------------------------------------------------------------------ plumbing
    def _sql(self, sql: str) -> str:
        return sql.replace("?", "%s") if self.is_pg else sql

    @contextmanager
    def _cursor(self):
        cur = self._conn.cursor()
        try:
            yield cur
            self._conn.commit()
        except Exception:
            self._conn.rollback()
            raise
        finally:
            cur.close()

    def _all(self, sql: str, params: Sequence[Any] = ()) -> List[Tuple]:
        with self._cursor() as cur:
            cur.execute(self._sql(sql), tuple(params))
            return [tuple(r) for r in cur.fetchall()]

    def _exec(self, sql: str, params: Sequence[Any] = ()) -> None:
        with self._cursor() as cur:
            cur.execute(self._sql(sql), tuple(params))

    def _many(self, sql: str, rows: Iterable[Sequence[Any]]) -> None:
        rows = [tuple(r) for r in rows]
        if not rows:
            return
        with self._cursor() as cur:
            cur.executemany(self._sql(sql), rows)

    def close(self) -> None:
        self._conn.close()

    def ensure_schema(self) -> None:
        for stmt in SCHEMA:
            self._exec(stmt)

    # ------------------------------------------------------------------ topics
    def upsert_topic(
        self, label: str, query: str, kind: str = "search", hydrate_all: bool = True, topic_id: Optional[str] = None
    ) -> str:
        tid = topic_id or slugify(label)
        self._exec(
            """INSERT INTO topics (topic_id, label, query, kind, hydrate_all, is_active, created_at)
               VALUES (?, ?, ?, ?, ?, 1, ?)
               ON CONFLICT (topic_id) DO UPDATE SET label = excluded.label, query = excluded.query,
                 kind = excluded.kind, hydrate_all = excluded.hydrate_all, is_active = 1""",
            (tid, label.strip(), query.strip(), kind, int(hydrate_all), now_iso()),
        )
        return tid

    def deactivate_topic(self, topic_id: str) -> None:
        self._exec("UPDATE topics SET is_active = 0 WHERE topic_id = ?", (topic_id,))

    def list_topics(self, active_only: bool = True) -> List[Dict[str, Any]]:
        sql = "SELECT topic_id, label, query, kind, hydrate_all, is_active FROM topics"
        if active_only:
            sql += " WHERE is_active = 1"
        sql += " ORDER BY created_at, topic_id"
        return [
            dict(topic_id=r[0], label=r[1], query=r[2], kind=r[3], hydrate_all=bool(r[4]), is_active=bool(r[5]))
            for r in self._all(sql)
        ]

    # ------------------------------------------------------------------ ingest
    def save_papers(self, topic_id: str, papers: Sequence[RecentPaper]) -> Tuple[int, int]:
        """Stores papers and their reference edges. Returns (new_papers, new_edges)."""
        if not papers:
            return 0, 0
        seen = now_iso()
        ids = [short_id(p.id) for p in papers]
        existing_papers = self._count_in("papers", "work_id", ids)
        edge_rows = []
        for p in papers:
            src = short_id(p.id)
            for ref in {short_id(r) for r in p.referenced_works if r}:
                edge_rows.append((src, ref, p.publication_date or seen[:10]))
        edges_before = self._count_edges_for_sources(ids)

        self._many(
            """INSERT INTO papers (work_id, title, publication_date, publication_year, primary_topic, doi, first_seen)
               VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (work_id) DO NOTHING""",
            [(short_id(p.id), p.title, p.publication_date, p.publication_year, p.primary_topic, p.doi, seen) for p in papers],
        )
        self._many(
            "INSERT INTO paper_topics (work_id, topic_id) VALUES (?, ?) ON CONFLICT (work_id, topic_id) DO NOTHING",
            [(i, topic_id) for i in ids],
        )
        self._many(
            "INSERT INTO edges (source_id, target_id, edge_date) VALUES (?, ?, ?) ON CONFLICT (source_id, target_id) DO NOTHING",
            edge_rows,
        )
        edges_after = self._count_edges_for_sources(ids)
        return len(ids) - existing_papers, edges_after - edges_before

    def _count_in(self, table: str, col: str, ids: Sequence[str]) -> int:
        total = 0
        for i in range(0, len(ids), 500):
            chunk = list(ids[i : i + 500])
            marks = ",".join("?" * len(chunk))
            total += self._all(f"SELECT COUNT(*) FROM {table} WHERE {col} IN ({marks})", chunk)[0][0]
        return total

    def _count_edges_for_sources(self, ids: Sequence[str]) -> int:
        return self._count_in("edges", "source_id", ids)

    # ------------------------------------------------------------------ analysis queries
    def topic_window_stats(self, topic_id: str, since: str) -> Dict[str, int]:
        papers = self._all(
            """SELECT COUNT(*) FROM papers p JOIN paper_topics t ON t.work_id = p.work_id
               WHERE t.topic_id = ? AND p.publication_date >= ?""",
            (topic_id, since),
        )[0][0]
        edges, unique = self._all(
            """SELECT COUNT(*), COUNT(DISTINCT e.target_id) FROM edges e
               JOIN paper_topics t ON t.work_id = e.source_id
               WHERE t.topic_id = ? AND e.edge_date >= ?""",
            (topic_id, since),
        )[0]
        return {"papers": papers, "edges": edges, "unique_cited": unique}

    def velocity(self, topic_id: str, since: str, min_count: int = 1, limit: int = 5000) -> List[Tuple[str, int]]:
        """(target_id, number of distinct topic papers published >= since that cite it), highest first."""
        rows = self._all(
            """SELECT e.target_id, COUNT(DISTINCT e.source_id) AS n FROM edges e
               JOIN paper_topics t ON t.work_id = e.source_id
               WHERE t.topic_id = ? AND e.edge_date >= ?
               GROUP BY e.target_id HAVING COUNT(DISTINCT e.source_id) >= ?
               ORDER BY n DESC, e.target_id LIMIT ?""",
            (topic_id, since, min_count, limit),
        )
        return [(r[0], int(r[1])) for r in rows]

    def citing_samples(self, topic_id: str, target_ids: Sequence[str], since: str, k: int = 4) -> Dict[str, List[Dict[str, str]]]:
        out: Dict[str, List[Dict[str, str]]] = {}
        for i in range(0, len(target_ids), 200):
            chunk = list(target_ids[i : i + 200])
            marks = ",".join("?" * len(chunk))
            rows = self._all(
                f"""SELECT e.target_id, p.work_id, p.title FROM edges e
                    JOIN papers p ON p.work_id = e.source_id
                    JOIN paper_topics t ON t.work_id = e.source_id
                    WHERE t.topic_id = ? AND e.edge_date >= ? AND e.target_id IN ({marks})
                    ORDER BY e.target_id, p.publication_date DESC, p.work_id""",
                [topic_id, since, *chunk],
            )
            for target, wid, title in rows:
                lst = out.setdefault(target, [])
                if len(lst) < k:
                    lst.append({"id": wid, "title": title or "Untitled Work"})
        return out

    def citing_titles(self, topic_id: str, target_id: str, since: str, k: int = 12) -> List[str]:
        rows = self._all(
            """SELECT p.title FROM edges e JOIN papers p ON p.work_id = e.source_id
               JOIN paper_topics t ON t.work_id = e.source_id
               WHERE t.topic_id = ? AND e.target_id = ? AND e.edge_date >= ? LIMIT ?""",
            (topic_id, target_id, since, k),
        )
        return [r[0] or "" for r in rows]

    # ------------------------------------------------------------------ works catalogue
    def missing_or_stale_works(self, ids: Sequence[str], max_age_days: int = 30) -> List[str]:
        if not ids:
            return []
        cutoff = datetime.now(timezone.utc).timestamp() - max_age_days * 86400
        cutoff_iso = datetime.fromtimestamp(cutoff, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        fresh = set()
        for i in range(0, len(ids), 500):
            chunk = list(ids[i : i + 500])
            marks = ",".join("?" * len(chunk))
            for (wid,) in self._all(
                f"SELECT work_id FROM works WHERE work_id IN ({marks}) AND fetched_at >= ?", [*chunk, cutoff_iso]
            ):
                fresh.add(wid)
        return [i for i in ids if i not in fresh]

    def upsert_works(self, works: Sequence[Dict[str, Any]]) -> None:
        rows = []
        stamp = now_iso()
        for w in works:
            topic = w.get("primary_topic") or {}
            rows.append(
                (
                    short_id(w.get("id", "")),
                    w.get("title"),
                    w.get("publication_year"),
                    w.get("cited_by_count"),
                    json.dumps(
                        [
                            a.get("author", {}).get("display_name")
                            for a in w.get("authorships", [])
                            if a.get("author", {}).get("display_name")
                        ][:6]
                    ),
                    w.get("abstract_text") or "",
                    w.get("doi"),
                    topic.get("display_name"),
                    (topic.get("subfield") or {}).get("display_name"),
                    stamp,
                )
            )
        self._many(
            """INSERT INTO works (work_id, title, publication_year, cited_by_count, authors, abstract, doi,
                                 primary_topic, subfield, fetched_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT (work_id) DO UPDATE SET title = excluded.title,
                 publication_year = excluded.publication_year, cited_by_count = excluded.cited_by_count,
                 authors = excluded.authors, abstract = excluded.abstract, doi = excluded.doi,
                 primary_topic = excluded.primary_topic, subfield = excluded.subfield, fetched_at = excluded.fetched_at""",
            rows,
        )

    def get_works(self, ids: Sequence[str]) -> Dict[str, Dict[str, Any]]:
        out: Dict[str, Dict[str, Any]] = {}
        for i in range(0, len(ids), 500):
            chunk = list(ids[i : i + 500])
            marks = ",".join("?" * len(chunk))
            for r in self._all(
                f"""SELECT work_id, title, publication_year, cited_by_count, authors, abstract, doi, primary_topic, subfield
                    FROM works WHERE work_id IN ({marks})""",
                chunk,
            ):
                out[r[0]] = dict(
                    work_id=r[0], title=r[1], publication_year=r[2], cited_by_count=r[3],
                    authors=json.loads(r[4] or "[]"), abstract=r[5] or "", doi=r[6], primary_topic=r[7], subfield=r[8],
                )
        return out

    # ------------------------------------------------------------------ snapshots, runs, growth
    def save_snapshot(self, kind: str, topic_id: str, window_days: int, payload: Dict[str, Any]) -> None:
        self._exec(
            """INSERT INTO snapshots (kind, topic_id, window_days, computed_at, payload) VALUES (?, ?, ?, ?, ?)
               ON CONFLICT (kind, topic_id, window_days) DO UPDATE SET computed_at = excluded.computed_at,
                 payload = excluded.payload""",
            (kind, topic_id, window_days, now_iso(), json.dumps(payload)),
        )

    def get_snapshot(self, kind: str, topic_id: str, window_days: int) -> Optional[Dict[str, Any]]:
        rows = self._all(
            "SELECT computed_at, payload FROM snapshots WHERE kind = ? AND topic_id = ? AND window_days = ?",
            (kind, topic_id, window_days),
        )
        if not rows:
            return None
        data = json.loads(rows[0][1])
        data["computed_at"] = rows[0][0]
        return data

    def start_run(self, run_id: str, topic_id: str) -> None:
        self._exec(
            "INSERT INTO runs (run_id, topic_id, started_at, status) VALUES (?, ?, ?, 'running')",
            (run_id, topic_id, now_iso()),
        )

    def finish_run(self, run_id: str, status: str, seen: int, new_papers: int, new_edges: int, truncated: bool, error: str = "") -> None:
        self._exec(
            """UPDATE runs SET finished_at = ?, status = ?, papers_seen = ?, papers_new = ?, edges_new = ?,
               truncated = ?, error = ? WHERE run_id = ?""",
            (now_iso(), status, seen, new_papers, new_edges, int(truncated), error[:500], run_id),
        )

    def totals(self) -> Dict[str, int]:
        return {
            "papers": self._all("SELECT COUNT(*) FROM papers")[0][0],
            "edges": self._all("SELECT COUNT(*) FROM edges")[0][0],
            "works": self._all("SELECT COUNT(*) FROM works")[0][0],
            "topics": self._all("SELECT COUNT(*) FROM topics WHERE is_active = 1")[0][0],
        }

    def growth(self, days: int = 30) -> List[Dict[str, Any]]:
        """Papers first seen per day (the database growth curve)."""
        rows = self._all(
            """SELECT SUBSTR(first_seen, 1, 10) AS d, COUNT(*) FROM papers GROUP BY SUBSTR(first_seen, 1, 10)
               ORDER BY d DESC LIMIT ?""",
            (days,),
        )
        return [{"date": r[0], "papers": int(r[1])} for r in reversed(rows)]

    def last_runs(self, limit: int = 10) -> List[Dict[str, Any]]:
        rows = self._all(
            """SELECT run_id, topic_id, started_at, finished_at, status, papers_seen, papers_new, edges_new, truncated, error
               FROM runs ORDER BY started_at DESC LIMIT ?""",
            (limit,),
        )
        keys = ["run_id", "topic_id", "started_at", "finished_at", "status", "papers_seen", "papers_new", "edges_new", "truncated", "error"]
        return [dict(zip(keys, r)) for r in rows]
