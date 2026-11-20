import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests of the built style guide, which "pnpm test:browser" builds first, and of an app
 * on the Tailwind entry, which its tests build.
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
    // the guide is served from its base path, as on GitHub Pages
    url: 'http://127.0.0.1:4173/design-system/',
    reuseExistingServer: !process.env.CI,
  },
})
