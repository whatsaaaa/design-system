import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests of the built style guide, which "pnpm test:browser" builds first, and of an app
 * on the Tailwind entry, which its tests build.
 *
 * Screenshots are compared on Linux only, in the Playwright container, where they are taken.
 * On another system the screenshot tests skip and the rest runs.
 *
 * Every run serves the guide itself, on a port of its own, and never takes a server that is
 * already running for its own: that could be another copy of the repository with another build.
 * STYLEGUIDE_URL names a server to test instead, such as "pnpm styleguide:preview":
 *
 *   STYLEGUIDE_URL=http://127.0.0.1:4173 pnpm test:browser:run
 */
export default defineConfig({
  testDir: 'tests/browser',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    // set by then: every worker reads this file again, after the server below has started
    baseURL: process.env.STYLEGUIDE_URL,
    colorScheme: 'dark',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      // a few pixels of anti-aliasing may differ between machines. A real change moves far more.
      maxDiffPixels: 150,
    },
  },
  webServer: process.env.STYLEGUIDE_URL
    ? undefined
    : {
        // the guide is served from its base path, as on GitHub Pages
        command: 'node scripts/serve-styleguide.ts',
        // the address the server prints, which goes to the environment as STYLEGUIDE_URL
        wait: { stdout: /style guide served at (?<styleguide_url>\S+)/ },
      },
})
