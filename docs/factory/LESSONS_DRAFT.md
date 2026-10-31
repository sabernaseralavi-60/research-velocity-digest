# LESSONS_DRAFT (flushed into the global ledger by webapp-retro)

1. **OpenAlex now meters usage** (free per-IP daily budget; a free API key gives its own budget) and **requires a key for cursor paging past page 1** (HTTP 401 "API key required for cursor paging"). Keyless code must use `page=` (max 10,000). Found only by running the real ingest; unit tests with mocks passed. Applied: fetcher chooses paging by key presence; error hint; test.
2. **A "newest N papers" cap silently biases any time window**: all 300 papers came from one day, so the 7- and 30-day windows were identical. Fix: sample per day for broad topics and report real coverage dates in the payload and UI.
3. **Measure growth before choosing a free tier**: 31 days of one broad topic = 290k edges = 42 MB; a year would exceed Neon's free 0.5 GB. Applied: 90-day retention (windows <= 30 days).
4. **PowerShell 5.1 `Set-Content -Encoding utf8` adds a BOM**, and the Write tool preserved that BOM when overwriting; `JSON.parse`/tsx then fail ("Error parsing package.json") while `npm install` tolerates it. Use `[IO.File]::WriteAllText(path, text, UTF8Encoding($false))` and check `[IO.File]::ReadAllBytes(p)[0..2]`.
5. **Screenshots caught 4 UI defects that all tests passed** (misleading "Lookback 7 days" with 30 selected, one huge growth bar, "1 candidates", unlabeled select). Looking at them is part of verification.
6. My own hand-calculated test expectation was wrong once (4.11 vs 4.12): recompute with more digits before changing code.
7. Builder docs presented fixture output (the "live screenshot" sleeping beauties with scores 4.51/4.39) as discoveries: always trace a displayed number to its data source.
8. `getByLabel` with a `<select>` inside a `<label>` includes the option texts in the accessible name: give selects an explicit `aria-label`.
