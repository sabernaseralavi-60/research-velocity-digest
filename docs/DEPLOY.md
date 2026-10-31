# Deploying: Vercel (dashboard + API) + Neon (database) + GitHub Actions (daily job)

Status: **not deployed yet** (needs the owner's go-ahead for the cloud resources; see docs/factory/STATE.md).

## One-time setup

1. **OpenAlex key (owner, 2 minutes):** sign in at https://openalex.org/settings/api, create a free key (own daily budget).
2. **Database:** create a Neon project (free tier). Easiest through Vercel: `vercel integration add neon` in the linked project, or create it at neon.tech and copy the *pooled* connection string. The job creates the tables itself (`CREATE TABLE IF NOT EXISTS`).
3. **GitHub secrets** (repo Settings > Secrets and variables > Actions, or `gh secret set NAME`):
   * `DATABASE_URL` - the Neon connection string
   * `OPENALEX_API_KEY` - from step 1
   * `OPENALEX_POLITE_EMAIL` - optional contact address
4. **Vercel:** import this repo (framework Vite is detected; `vercel.json` routes `/api/*` to `api/index.ts`). Environment variables: `DATABASE_URL` (Neon, added by the integration) and `ADMIN_TOKEN` (a long random string; mark it sensitive).
5. **First data:** GitHub > Actions > "Daily citation database update" > Run workflow (leave inputs empty). The first run backfills 30 days and takes several minutes; afterwards it runs every day at 04:30 UTC.

## Operations

* Add a topic: dashboard > "Manage monitored topics" (admin token), then run the workflow once so it is backfilled, or wait for the next daily run.
* Size: about 10k reference edges per day for the broad AI topic; `RETAIN_DAYS=90` keeps the database far below the free 0.5 GB (measured: 31 days = 290k edges = 42 MB in SQLite).
* If the job fails with HTTP 401/402/403 the OpenAlex budget or key is the cause (see the message printed by the job).
* Rollback: Vercel > Deployments > promote the previous deployment; the database is append-only per day and can be re-filled with the workflow input `days`.
