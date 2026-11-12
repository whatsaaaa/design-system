import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests of the built style guide. "pnpm test:browser" builds it first.
 *
 * Screenshots are compared on Linux only, in the Playwright container, where they are taken.
 * On another system the screenshot tests skip and the rest runs.
 */
export default defineConfig({
  testDir: 'tests/browser',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'dark',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      // a few pixels of anti-aliasing may differ between machines. A real change moves far more.
      maxDiffPixels: 150,
    },
  },
  webServer: {
    command: 'pnpm exec vitepress preview styleguide --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
