# SCORECARD (0-10, honest; evidence in FINDINGS.md / VERIFIED.md)

| Dimension | Before (v0 baseline) | After (this session) | Weakest point left |
|---|---|---|---|
| Spec coverage | 3 - dashboard on fixture data; no daily DB, topics client-side only | 7 - daily DB job, user topics, trending/sleeping/gems from real data; not deployed | 2-3-hop funnel, true semantic embeddings, e-mail from DB not done |
| Correctness | 4 - missing import crash, truncated windows, hard-coded year | 7 - hand-checked formulas, per-day sampling, coverage reported | no ground-truth backtest |
| Security | 3 - unescaped e-mail HTML, default personal address | 7 - escaped output, token-guarded writes, redacted errors | Postgres/Vercel runtime not exercised; in-memory rate limit per instance |
| Honesty | 2 - synthetic data presented as findings, silent fallback | 8 - demo labelled, live never substitutes, heuristics named | scoring constants are still uncalibrated heuristics |
| UX / a11y / RTL | 5 | 6 - labels, aria names, mobile checked | no Persian/RTL UI (decision pending) |
| Performance / resilience | 4 | 6 - retry/backoff correct, retention, idempotent writes | none measured on Neon |
| Operations | 2 - no install, no CI | 7 - lockfile, CI (4 jobs), Docker, daily workflow | needs owner secrets to run in the cloud |
| Docs | 4 | 7 - README, DEPLOY, factory docs | |
| **Overall** | **~3.4** | **~6.9** | cloud run not yet proven |
