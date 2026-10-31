# FINDINGS - audit of v0 (AI Studio output, baseline fbbf1e3), 2026-10-31

Severity: S1 = blocks use / dishonest core claim / data or secret risk; S2 = wrong or missing behaviour the spec asks for; S3 = quality.
Evidence column: what was run or read. "run" = executed in this session; "read" = read in code.

| ID | Sev | Dimension | Finding | Evidence | Status |
|---|---|---|---|---|---|
| F-001 | S1 | operations | Plain `npm install` fails (ERESOLVE): `esbuild ^0.25` vs vite 8 peer. No lockfile, so builds are not reproducible. | run: clean clone, npm exit with ERESOLVE | open |
| F-002 | S1 | honesty | The "Benchmark (Instant)" data is synthetic: ids such as `W_ATTENTION`, `W_DORMANT_GNN`, invented papers and authors (`openAlexService.ts` 8-606). The spec presents the dashboard's "Sleeping Beauties" (awakening 4.51 / 4.39) and latent gems as discovered findings. They come from this fixture, not from OpenAlex. | read | open |
| F-003 | S1 | honesty | Live mode falls back **silently** to the synthetic fixture on any network error / empty result (`openAlexService.ts` 653-657). The user would read invented papers as real live results. | read | open |
| F-004 | S1 | spec coverage | Spec asks for an autonomous daily monitor that stores reference lists in a database and grows it. v0: the web app has no server, no database; Python `database.py`, `latent_gems.py`, `sleeping_beauty.py` are **not called** from `pipeline/main.py`; the weekly workflow keeps nothing between runs (artifact only, 14 days). | read: main.py imports only config/fetcher/analyzer/mailer | open |
| F-005 | S2 | correctness | `App.tsx:243` calls `renderEmailDigestHtml` without import: `tsc` error TS2304 and a ReferenceError when the "email" tab renders. | run: `tsc --noEmit` | open |
| F-006 | S2 | honesty | Latent-gem "semantic similarity" is `0.45 + 0.18 * (number of keyword substring hits)` (Python) / `0.5 + 0.2 * hits` (TS): a keyword count labelled as semantic similarity. The two implementations also disagree on constants (potential factor 15 vs 16; thresholds 3.0 vs 2.5; cut 150 vs 120). | read | open |
| F-007 | S2 | correctness | Sleeping-beauty score: spec formula (burst ratio x log) differs from code (`log10(52*recent / rate) * sqrt(age)`); `currentYear = 2026` is hard-coded in TS and Python; recent weekly count is annualised x52 even when the window is 3-30 days. | read | open |
| F-008 | S2 | correctness | Live ingest sorts by date desc and stops at `max_recent_papers_to_scan` (300): a 7-day window is really "the newest N papers", biasing velocity toward the latest day. A 3-day run scanned 200 papers. | run (200 papers / 3 days) + read | open |
| F-009 | S2 | spec coverage | User-defined topics/keywords (spec "topic 1") exist only as a client-side substring filter on 3 seeded keywords; the live fetch ignores them (fixed concept ids C154945302/C119857082/C108827166, deprecated OpenAlex concepts). | read | open |
| F-010 | S2 | security | Email templates interpolate paper titles/abstracts from OpenAlex without escaping: Jinja2 `Template(...)` has autoescape off, fallback renderer uses f-strings. Untrusted text is rendered into HTML mail. | read mailer.py 32-47 | open |
| F-011 | S2 | honesty | "Simulate Dispatch" and a test-send field in `EmailPreviewModal` fake sending (`setTimeout`); the spec describes it as a test send to the owner. Must be labelled as preview only. | read | open |
| F-012 | S2 | operations | `docker-compose.yml` builds `.` but there is no `Dockerfile`; spec lists one. `setup_github_sync.sh` runs `git push --force` and `git commit ... || true`. | read | open |
| F-013 | S2 | operations | No CI for the web app (the only workflow runs the weekly job); no `test` script; Python tests do not cover fetcher, DB, mailer, sleeping beauty. | read | open |
| F-014 | S2 | operations | Hard-coded owner e-mail as default for polite pool and recipient in code and UI default state (`config.py`, `App.tsx`). A public repo should not default to a private address; the default belongs in env. | read | open |
| F-015 | S3 | correctness | Scholar link wraps already-quoted titles in a second pair of quotes (`%22%22Why...%22%22`). | run (digest output #3) | open |
| F-016 | S3 | UX | No RTL/Persian support although the owner is Persian-speaking (UI strings English). Dashboard is dark theme only. | scan: RTL not detected | open (decision pending) |
| F-017 | S3 | honesty | `Math`-free UI but several static claims: "100% compatible with all email clients", "bug-free ... ready to deploy" are in the spec text, not verified. | spec | note only |
| F-018 | S3 | operations | `.aistudio/` was not git-ignored; README carries the AI Studio banner and wrong run text; package name `react-example`. | read | partly fixed in baseline .gitignore |

## Facts measured on v0 (run)
- `python -m unittest pipeline.test_pipeline`: 4 tests OK (they test only the scholar helpers and a hand-built Counter, not the analyzer).
- After the esbuild fix: `npm install` clean (180 packages, 0 vulnerabilities), `vite build` OK (328 kB JS, 96 kB gzip), `tsx --test` 6/6 OK, `tsc` 1 error (F-005).
- Live OpenAlex works: 200 papers in 3 days with references, 6,191 reference links, 6,030 unique cited, 9 works at velocity >= 5 (top: ResNet 11, "Deep learning" 7). As the spec itself warns, classics dominate raw velocity: the Sleeping-Beauty and latent-gem modules are the actual novelty and are the parts that are not wired to real data.
