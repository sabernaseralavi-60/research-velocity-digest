import { defineConfig, devices } from '@playwright/test';

// The e2e suite runs against the PRODUCTION build served by server/dev.ts (same API handler as Vercel).
// E2E_DB must point to a database written by pipeline.daily (or scripts/make_fixture_db.py).
const port = 4173;

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${port}`, screenshot: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node node_modules/tsx/dist/cli.mjs server/dev.ts',
    port,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: String(port),
      SQLITE_PATH: process.env.E2E_DB || 'output/e2e.db',
      ADMIN_TOKEN: 'e2e-admin-token',
    },
  },
});
