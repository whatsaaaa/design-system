import { expect, test } from '@playwright/test'
import { DESKTOP, PAGES, PHONE, open, settle } from './pages.ts'

/**
 * Every page of the style guide against its stored screenshot, in both themes at desktop
 * width and in dark at phone width.
 *
 * Text is drawn differently on every system, so the screenshots are taken and compared in
 * one place: the Playwright container, on Linux. Update them with pnpm test:browser:update.
 */
test.skip(
  process.platform !== 'linux',
  'screenshots are compared on Linux, in the Playwright container',
)

const shots = [
  { suffix: 'desktop-dark', viewport: DESKTOP, colorScheme: 'dark' },
  { suffix: 'desktop-light', viewport: DESKTOP, colorScheme: 'light' },
  { suffix: 'phone-dark', viewport: PHONE, colorScheme: 'dark' },
] as const

for (const { suffix, viewport, colorScheme } of shots) {
  test.describe(suffix, () => {
    test.use({ viewport, colorScheme })

    for (const { name, path } of PAGES) {
      test(name, async ({ page }) => {
        await open(page, path)
        // A window as tall as the page shows all of it at once, with the status line at its end.
        const height = await page.evaluate(() => document.documentElement.scrollHeight)
        await page.setViewportSize({
          width: viewport.width,
          height: Math.max(height, viewport.height),
        })
        await settle(page)
        await expect(page).toHaveScreenshot(`${name}-${suffix}.png`)
      })
    }
  })
}
