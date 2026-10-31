# Automatic scan - research-velocity-digest+++ (2026-10-31)

> Regex candidates and a stack profile. Nothing here is a finding until the code is read and the result is written into FINDINGS.md with evidence. Absence of a hit is not proof of absence.

## Profile

- git: **not a git repository**
- AI-Studio baseline markers: True; stack: @google/genai, express, react, tailwindcss, tsx, typescript, vite
- source size: 5175 lines; python files: 12; lockfile: NONE; node_modules: False
- tests: 2 test files, test script: False; CI workflow: True; Dockerfile: False
- .env.example: True; .gitignore covers .env: True; covers .aistudio: False
- RTL support detected: False; docs: 5 files
- risk flags (files): {'auth': 4, 'money': 1, 'pii': 13, 'database': 1}
- **recommended depth: deep** (score 7; auth/money/PII/multi-tenant = 2 each, >5k LOC = 1, >15k LOC = +1, AI = 1; >=4 deep, >=2 standard)

Flag evidence (first files):
  - auth: pipeline/config.py, pipeline/mailer.py, src/components/CodeExplorer.tsx, src/components/SetupGuideModal.tsx
  - money: src/components/CodeExplorer.tsx
  - pii: index.html, pipeline/config.py, pipeline/mailer.py, pipeline/main.py, pipeline/templates/digest_email.html, src/App.tsx
  - database: pipeline/database.py

## Structural gaps

- no git repository (init before any change; first commit = untouched baseline)
- no lockfile (builds are not reproducible)
- no `test` script in package.json
- .aistudio/ is not git-ignored (builder artifacts and screenshots must not be pushed)

## Pattern candidates (7)

| sev | id | where | note |
|---|---|---|---|
| med | OPS-NO-HELMET | package.json:1 | express without helmet (security headers) |
| med | OPS-NO-RATELIMIT | package.json:1 | express without a rate limiter |
| med | OPS-PEER-ESBUILD | package.json:1 | esbuild < 0.27 with vite >= 8: `npm install` fails (ERESOLVE); bump esbuild to ^0.28 |
| low | HON-SIMULATE | src/components/EmailPreviewModal.tsx:119 | simulated/fake data wording: check it is labelled in the UI |
| low | HON-SIMULATE | src/components/EmailPreviewModal.tsx:136 | simulated/fake data wording: check it is labelled in the UI |
| low | HON-SIMULATE | src/components/PipelineControlPanel.tsx:232 | simulated/fake data wording: check it is labelled in the UI |
| low | HON-SIMULATE | src/components/TrendingPapersTable.tsx:80 | simulated/fake data wording: check it is labelled in the UI |
