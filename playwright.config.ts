import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: process.env.PORTFOLIO_TEST_ARTIFACTS ?? `test-results/run-${process.pid}`,
  fullyParallel: true,
  workers: 3,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: `playwright-report/run-${process.pid}` }], ['json', { outputFile: process.env.PORTFOLIO_BROWSER_REPORT ?? `test-results/run-${process.pid}/report.json` }]],
  use: {
    baseURL: process.env.PORTFOLIO_TEST_URL ?? 'http://127.0.0.1:4322',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PORTFOLIO_TEST_URL ? undefined : {
    command: 'node scripts/serve-dist.mjs',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: false,
  },
});
