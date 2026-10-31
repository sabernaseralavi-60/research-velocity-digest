# STATE - research-velocity-digest+++ (web app factory)

> The factory resumes from this file. Update it at every stage boundary and at session end.
> Resume phrase: «کارخانه وب اپ: ادامه» (skill `webapp-factory`).

## Where we are
- Stage: 2-audit (intake done 2026-10-31)
- Created: 2026-10-31   Last session: 2026-10-31
- Depth: **deep** (scan score 7: auth/PII flags in mailer+config, >5k LOC, AI-labelled features)   reason: the spec asks for an autonomous, daily, DB-backed pipeline with user topics and an email dispatcher holding SMTP secrets.
- Baseline: untouched first commit = **fbbf1e3** ("baseline: builder output (untouched)", .gitignore extended before commit with .aistudio/, *.docx, output/, *.db)   Builder: Google AI Studio (client-only Vite SPA + Python pipeline; there is NO server.ts despite the scan marker)

## Inputs
- Spec file: `AI Research Velocity Digest.docx` (ChatGPT guide, 370 paragraphs, kept out of git) -> register: `docs/factory/TRACE.md` (to write)
- Owner constraints heard so far (dated):
  - 2026-10-31: «کارخانه تولید اپ» -> web app factory.
  - Spec section "two interesting topics": (1) user-chosen keywords / Google-Scholar-style labels (e.g. surrogate safety measures, household travel survey) instead of fixed AI subfields; the app must by itself, with no human and no local computer on, scan new papers every 24 h, store reference lists in a database, compute with the best professional function (also as a Python package) so a strong database grows daily and is the basis for newer indices. (2) Find "pre-awakening latent gems": old papers not yet cited but with Sleeping-Beauty-like potential (semantic search / embeddings; cannot embed all hundreds of thousands, so funnel).
  - Spec: move the whole code to a given GitHub repo with minimum manual work.

## Durable authorizations (user words, dated)  - nothing is assumed beyond this list
- GitHub repo: https://github.com/sabernaseralavi-60/research-velocity-digest (given by owner 2026-10-31; public; empty at intake; push allowed: normal push at green points, no force)
- Hosting target: Vercel + Neon (standing rule in CLAUDE.md applies only after the owner says "fix everything and run it"; free tier only) - not yet exercised this run.
- Paid services / domain: none

## Decisions (why, not only what)
| Date | Decision | Alternatives | Reason |
|---|---|---|---|
| 2026-10-31 | Keep `AI Research Velocity Digest.docx` out of git (`*.docx` ignored) | commit it | third-party/ChatGPT text, contains owner e-mail, not code |
| 2026-10-31 | Ignore `.aistudio/` | commit screenshots | builder artifacts (standard section 3) |
| 2026-10-31 | Do not run `setup_github_sync.sh` (it does `git push --force`) | run as spec says | force-push is forbidden by factory rules; normal push instead; script to be fixed/removed in harden |
| 2026-10-31 | git author set locally to owner name + email from account context | leave unset | commit needed an identity |

## Open questions that really need the owner (few; everything else is decided and logged above)
- Owner-only: SMTP app password / recipient for e-mail delivery (GitHub Secrets), if scheduled mail is wanted.

## Decisions added later on 2026-10-31
| Decision | Reason |
|---|---|
| Database = Neon Postgres in production, SQLite locally/CI; one portable SQL schema | free, same code path |
| Daily job in GitHub Actions (Python); dashboard + read API on Vercel | spec: no local PC, free; Python is the compute core |
| Without OPENALEX_API_KEY use `page=` paging | OpenAlex needs a key for cursor paging past page 1 (HTTP 401 observed) |
| Broad AI topic sampled per day (300/day); retention 90 days | measured 42 MB per 31 days; Neon free tier is 0.5 GB |
| Latent-gem similarity = lexical TF-IDF, 1 hop, labelled so | no embedding dependency; embedding 250M papers is infeasible |
| UI default source = database; demo + in-browser live kept, labelled | honesty |
| Cloud resources NOT created yet | CLAUDE.md authorises Neon + Vercel only after the owner says "fix everything and run it" for this project |

## Stage now
Hardened, pushed (CI green incl. browser e2e), verified on a local production build with real OpenAlex data. 5-ship is blocked on the owner's go-ahead.

## Next steps (ordered, each ends with a verifiable result)
1. Owner: authorise Neon + Vercel (free) + GitHub secrets with the standing phrase, and create the free OpenAlex key (openalex.org/settings/api) -> then: create Neon, set secrets, run the workflow once, deploy, run e2e on the live URL, record URL in WEBAPPS.md.
2. Not done yet: e-mail digest from the DB snapshot (sleeping beauties + gems), 2-3 hop ancestral walk, Persian/RTL UI decision, Postgres path verification (happens in step 1).

## Verified vs not verified (short; full table in VERIFIED.md)
- Verified (facts run on baseline clone): `python -m unittest pipeline.test_pipeline` 4 tests OK; `npm install` (plain) FAILS with ERESOLVE (peer vite@8 vs esbuild 0.25).
- Not verified yet: build, TS lint, tsx tests, any live OpenAlex run, every number in the spec's "live screenshot" section.

## 2026-10-31 (after owner phrase "fix everything and run it") - SHIP BLOCKED BY VERCEL ACCOUNT
- Owner gave the go-ahead phrase. `vercel whoami` = sabernaseralavi-60, team saber11 (SaberNaseralavi), `gh` logged in.
- `vercel link` / `vercel project add` / `vercel integration add neon` all fail: "Your Team exceeded our fair use limits and has been blocked. (402)".
- Existing sites of the same team (trafficlab, silp-web, ham-masir) also return HTTP 402 when fetched -> the whole team is blocked, not only this project.
- Not bypassed: no new team/account, no reuse of the other projects' Neon databases (not authorised for this project).
- Nothing was created in the cloud. No secrets set (no DATABASE_URL to store yet).
- Owner options: (a) resolve the block with Vercel (vercel.link/fair-use; upgrade or appeal), then say "ادامه" -> link, Neon, deploy; (b) approve a Vercel-free host (e.g. free Neon account created by owner + Render/Fly/GitHub Pages static snapshot) - needs a decision because it changes the architecture.

## 2026-10-31 (later) - owner decision: local viewing + daily run in the cloud (GitHub), no Vercel/Neon for now
- Owner: "local app opened as a Chrome startup tab; do NOT run the daily job on my PC; cloud daily on GitHub is great".
- Built: `daily_ingest.yml` SQLite mode (restore/publish `data-latest` release asset when DATABASE_URL is empty; Postgres mode unchanged), `scripts/sync_db.mjs`, `scripts/start_local.ps1`, `start-local.cmd`, `scripts/install_autostart.ps1` (Startup shortcut installed on the owner's PC), SQLite opened per query so the file can be replaced while the server runs. Local port 4791 (4173 is held by a VS Code Pylance process on this PC).
- Verified: workflow run 41211010626 green (cloud: 9,068 papers, 299,256 edges, 3 topics, 6 snapshots; asset 11.6 MB); snapshot downloaded and served locally, dashboard screenshot shows the cloud data, no console errors.
- Not verified: the scheduled (cron) run itself; second-day incremental run on the cloud; keyless OpenAlex over many days on shared runner IPs; Chrome startup tab (owner sets it in Chrome settings).
- Public web app (Vercel + Neon) stays on hold until the Vercel fair-use block is resolved.
