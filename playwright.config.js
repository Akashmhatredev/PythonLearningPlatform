import { defineConfig, devices } from '@playwright/test'

// E2E tests drive the real app in Chrome against a production build (vite
// preview), so Python runs exactly as it ships and dev-server reloads can't
// interfere. Uses the locally installed Chrome (channel: 'chrome'); run
// `npx playwright install chromium` and drop the channel line to use
// Playwright's bundled browser instead.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5176',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: 'npm run build && npx vite preview --port 5176 --strictPort',
    url: 'http://localhost:5176',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
