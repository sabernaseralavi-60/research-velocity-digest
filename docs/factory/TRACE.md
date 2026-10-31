# TRACE - requirement register (spec: "AI Research Velocity Digest" guide, 370 paragraphs)

Status: met / partial / open / n-a (n-a = context or claim, not a deliverable). Evidence is filled when verified; nothing is "met" without it.
Rows marked `implicit` were forgotten by the spec and added by the factory.

## A. Inverted reference index (core)
| ID | Requirement (spec wording, shortened) | Status | Evidence |
|---|---|---|---|
| R-A1 | Scan only recent papers (default 7 days, 3-30 selectable); extract `referenced_works`; invert and count in a hash map | partial | v0 Python+TS implement it; window truncated by scan cap (F-008) |
| R-A2 | Per cited work produce Google Scholar search link (exact title) | partial | works; double-quote bug F-015 |
| R-A3 | OpenAlex polite pool (`mailto`) | met (read) | fetcher.py params |
| R-A4 | Exponential backoff on 429 / network errors | partial | present, but `urlopen` raises HTTPError (non-200), the `status == 429` branch is dead code |
| R-A5 | KPI bar: new papers scanned, ref links, unique cited, velocity cutoff, surging found, pipeline time | partial | UI exists on seed data |
| R-A6 | Control centre: lookback 3-30, min velocity, top size, mode Benchmark/Live, subfields, Run button | partial | exists; Live falls back silently (F-003) |
| R-A7 | Paper cards: velocity badge, title/authors/year, key takeaway from abstract inverted index, citing context, Scholar / OpenAlex / BibTeX buttons | partial | exists on seed |
## B. Email digest
| R-B1 | Email preview modal desktop/mobile, copy HTML, download .html | partial | exists |
| R-B2 | "Test send" field | partial | simulated only (F-011) |
| R-B3 | Responsive HTML email, SMTP TLS 587 with app password, multipart | partial | exists; unescaped HTML (F-010) |
| R-B4 | GitHub Actions weekly Monday 09:00 UTC + manual dispatch | partial | exists; no persistence (F-004) |
## C. Algorithm page and code explorer
| R-C1 | Algorithm tab: brute-force vs inverted comparison, 4 lifecycle steps | partial | exists; check claims in text |
| R-C2 | Code explorer shows main.py, analyzer.py, fetcher.py, scholar.py, mailer.py, workflow, Dockerfile | partial | Dockerfile missing (F-012) |
| R-C3 | CLI: `python -m pipeline.main --dry-run`, `--days --min-citations --email` | met (run) | ran live 2026-10-31 |
## D. Sleeping Beauties and latent gems
| R-D1 | Awakening score: recent velocity vs historical annual rate, age >= 3, flagged by threshold | partial | formula differs from spec text (F-007); only on seed data in the UI |
| R-D2 | Show Sleeping Beauties section on dashboard and in the e-mail | partial | UI yes on seed; e-mail template check pending |
| R-D3 | Pre-awakening latent gems: old (8-35 y), little cited (<30-50), related to today's frontier, found by funnel: frontier extraction -> 2/3-hop ancestral walk -> stagnation filter -> potential score | open | engine is keyword counting on a 40-paper fixture (F-006) |
| R-D4 | Prefer semantic matching / embeddings without embedding everything | open | decision: real TF-IDF cosine over the funnelled candidates; optional embeddings later, labelled |
## E. Topics and autonomy (owner's two new ideas)
| R-E1 | User picks own keywords / Scholar-style labels (e.g. surrogate safety measures, household travel survey), persisted | open | F-009 |
| R-E2 | System runs by itself every 24 h with no human and no local computer | open | F-004 |
| R-E3 | Store references of every scanned paper in a database; the database grows daily and is the basis for newer indices | open | DB module unused |
| R-E4 | The computing core is a professional function / Python package | open | package layout to build (`pipeline` as an installable package) |
## F. Delivery
| R-F1 | Move all code to the owner's GitHub repo with minimum effort | partial | repo given; normal push at green points (script that force-pushes is retired) |
| R-F2 | Docker + docker-compose | partial | Dockerfile missing |
| R-F3 | Tests (`tsx --test`, `python -m unittest`) | partial | 6 + 4 pass; coverage thin (F-013) |
| R-F4 | Research roadmap (TGNN, SciBERT, citation intent, backtest P/R > 85 %) | n-a | a paper plan, not a deliverable of this app; the 85 % target is a claim to test, never to print |
## G. Implicit (not in the spec)
| I-1 | Server-side auth for any write/admin action (topic edits, run trigger) | open | topics endpoint must be token-protected; read-only public dashboard |
| I-2 | Secrets only in env/host store; no owner e-mail default in code | open | F-014 |
| I-3 | Empty-state, error-state, stale-data banner ("last updated", source = live DB or demo) | open | |
| I-4 | Input validation and rate limit on API; bounded OpenAlex usage | open | |
| I-5 | Cron endpoint/job idempotent (re-run the same day does not double-count edges) | open | |
| I-6 | Backup/export of the database (CSV/JSON snapshot) | open | |

## Status after the 2026-10-31 session (evidence in VERIFIED.md)
| ID | Status | Evidence / what remains |
|---|---|---|
| R-A1 | met (sampled) | per-day ingest, real coverage dates shown; broad topic is a 300/day sample (stated in UI) |
| R-A2 | met | scholar link quote bug fixed, unit test |
| R-A3, R-A4 | met | polite pool + API key; backoff rewritten (HTTPError handling, Retry-After), 4 tests |
| R-A5, R-A6, R-A7 | met | e2e on production build; BibTeX/Scholar/OpenAlex buttons unchanged from v0 (not re-tested individually) |
| R-B1 | met | preview modal kept; wording says preview only |
| R-B2 | changed | no fake send: labelled preview only (F-011) |
| R-B3 | partial | escaping tested; SMTP never run (no credentials) |
| R-B4 | partial | weekly workflow kept; new daily workflow written, not yet run in GitHub (needs secrets) |
| R-C1, R-C2 | partial | pages unchanged from v0; Dockerfile added; text claims not re-audited line by line |
| R-C3 | met | CLI run live |
| R-D1 | met (heuristic) | hand-checked formula; no backtest |
| R-D2 | partial | dashboard yes; not in the e-mail digest yet |
| R-D3 | partial | funnel steps 1,3,4 on real data (26 and 33 candidates); 2-3 hop ancestral walk not built |
| R-D4 | partial | lexical TF-IDF only, labelled; embeddings are future work |
| R-E1 | met | topics in DB, dashboard form (token), CLI flag, seed file |
| R-E2 | partial | workflow + DB written; not proven in the cloud |
| R-E3 | met locally | SQLite run measured; Postgres path unverified |
| R-E4 | partial | `pipeline` package importable; no PyPI packaging (not requested) |
| R-F1 | met | pushed to the owner's repo (normal push), CI green |
| R-F2 | met | Dockerfile builds in CI |
| R-F3 | met | 31 python + 13 TS + 14 browser tests |
| I-1 | met | token on writes, tested |
| I-2 | met | no personal address default in code (it remains in git history of the baseline commit) |
| I-3 | met | coverage/sampling/fallback notices |
| I-5 | met | idempotent upserts, tested |
| I-4, I-6 | open | per-instance rate limit only; no export endpoint |
