# VERIFIED - what was actually run (2026-10-31)

| Claim | How verified | Result |
|---|---|---|
| Clean install works | clean clone, `npm ci` (lockfile), `pip install -r requirements.txt` | pass; v0's plain `npm install` failed (ERESOLVE), fixed |
| Type check, build | `npm run lint`, `npm run build` in clean clone | pass |
| TS tests | `npm test` (6 index tests + 7 API tests) | 13/13 |
| Python tests | `python -m unittest discover` | 31/31, expected numbers computed by hand (awakening 4.51 / 6.27, latent 1.87, hand-checked in comments) |
| Real OpenAlex ingest | `python -m pipeline.daily` on SQLite, 31 days | AI broad topic 8,714 papers / 288,741 edges (sampled <= 300/day); focused topics 24 and 38 papers; finished in about 3.5 min; no failures after the paging fix |
| Browser e2e on the production build | Playwright, desktop 1366 + Pixel 7, 14 tests, run twice: fixture DB (clean clone) and the real-data DB | 14/14 and 7/7; screenshots were looked at; they exposed 4 defects (missing aria name, single-bar growth chart, "Lookback 7 days" while 30 selected, "1 candidates") - all fixed |
| Live-failure honesty (F-003) | e2e stubs api.openalex.org with HTTP 500 | alert shown, no data substituted |
| E-mail tab no longer crashes (F-005) | e2e + `tsc` | pass |
| Hostile text is escaped in e-mail (F-010) | unit test, both renderers | pass |
| Topic edits need the token | API tests (401 wrong/missing, 503 unset, 409 default topic, injection-shaped label stored as data) | pass |
| GitHub CI | run 41197132679 on c032f85 (python, web, docker) | success; run for 43d9410 (adds e2e job) pending at the time of writing |

## NOT verified (read before relying on it)
* **PostgreSQL / Neon path** (`psycopg`, `@neondatabase/serverless`): written to the same portable SQL as SQLite but never executed against Postgres in this session. First live run decides.
* **Vercel runtime** of `api/index.ts` (ESM, `node:sqlite` dynamic import branch) - not deployed yet.
* **Scoring quality.** The awakening score and the latent-gem potential are ranking heuristics from the spec. No backtest was run; the spec's "Precision/Recall > 85 %" claim is untested and is not shown anywhere in the app.
* **Gems found on real data are candidates by lexical overlap**, not validated as truly forgotten ideas; one citation hop only (the spec's 2-3 hop walk is not implemented).
* **E-mail delivery** (SMTP) was never run (no credentials); only rendering and escaping are tested.
* Sampling: for the broad AI topic the database holds at most 300 papers per day, so its counts describe a sample.
* OpenAlex budget: without an API key the job uses `page=` paging and the shared per-IP budget; GitHub-hosted runners share IPs, so a free key is needed for reliable daily runs (owner task).
