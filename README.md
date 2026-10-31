# AI Research Velocity Digest

Finds papers that the newest literature is citing *right now*, by inverting reference lists instead of re-polling old papers:

1. read the papers published in a recent window (OpenAlex), 2. extract their `referenced_works`, 3. count how many recent papers cite each work, 4. rank. A scheduled job stores everything in a database that grows every day, and computes three indices per topic:

| Index | Meaning | Honest limits |
|---|---|---|
| **Trending** | works cited by the most recent papers of a topic | counts come from the *stored* papers (a sample for the broad AI topic: up to 300 papers/day) |
| **Sleeping beauties** | old works cited again by recent papers: `log10(recent_annual_rate / historical_annual_rate + 1) * sqrt(age)` | ranking heuristic from the owner's spec, not calibrated against ground truth |
| **Latent gems** | old (8-35 y), rarely cited (<= 50) works that recent papers of the topic already cite, ranked by lexical TF-IDF similarity, age and obscurity | *lexical*, not semantic embeddings; one citation hop; a reading list, not a prediction |

## Parts

* `pipeline/` - Python package: OpenAlex client, SQLite/PostgreSQL store, index computation, daily job (`python -m pipeline.daily`), and the original digest CLI / e-mail (`python -m pipeline.main --dry-run`).
* `api/index.ts` - read API (`/api/status`, `/api/topics`, `/api/digest`) and token-protected topic edits; runs on Vercel, reads Neon.
* `src/` - React dashboard. Data sources: **Database (daily)** = real data from the API, **OpenAlex now** = ~50 newest papers fetched in the browser, **Demo (synthetic)** = invented fixture, always labelled.
* `.github/workflows/` - `ci.yml` (python, web, docker, browser e2e), `daily_ingest.yml` (every day 04:30 UTC), `weekly_digest.yml` (standalone e-mail digest).

## Run locally

```bash
pip install -r requirements.txt
python -m unittest discover -s pipeline -p "test_*.py" -t .
python -m pipeline.daily --db output/research_velocity.db      # first run backfills 30 days (a few minutes)

npm ci
npm test && npm run lint
npm run build && SQLITE_PATH=output/research_velocity.db ADMIN_TOKEN=choose-one npm run serve   # http://localhost:4173
npm run e2e          # needs a fixture DB: python scripts/make_fixture_db.py output/e2e.db
```

## Configuration (environment)

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | job, API | Postgres/Neon URL. Empty = local SQLite (`output/`). |
| `OPENALEX_API_KEY` | job | Free key from openalex.org/settings/api. Without it OpenAlex shares a small daily budget per IP address and does not allow cursor paging; the job then uses `page=` paging (max 10,000 records per query). Recommended for the scheduled job. |
| `OPENALEX_POLITE_EMAIL` | job | contact address sent as `mailto` |
| `ADMIN_TOKEN` | API | enables adding/removing topics from the dashboard; unset = editing disabled |
| `RETAIN_DAYS` | job | database retention (default 90; windows are at most 30 days) |
| `SMTP_*`, `RECIPIENT_EMAIL` | `pipeline.main` | e-mail digest |

Topics: `config/topics.default.json` seeds the first two (surrogate safety measures, household travel survey); add more from the dashboard or `python -m pipeline.daily --topic "my query"`. A topic query is an OpenAlex title-and-abstract search (quotes, AND/OR allowed).

See `docs/DEPLOY.md` for the Vercel + Neon + GitHub Actions setup and `docs/factory/` for the audit, requirement trace and verification record.
