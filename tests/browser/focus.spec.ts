import { expect, test } from '@playwright/test'
import { open } from './pages.ts'

/**
 * The status line lies over the bottom of the window. A control that takes the focus has to
 * come to rest above it, where it and its focus ring can be seen.
 */
test('a link reached with Tab is not left under the status line', async ({ page }) => {
  await open(page, '/docs/sample/conditions')
  const link = page.locator('.vp-doc a[href]').last()
  const statusLine = (await page.locator('.WsStatusLine').boundingBox())!

  // start on the control before the link
  await link.evaluate((element) => element.focus({ preventScroll: true }))
  await page.keyboard.press('Shift+Tab')
  await expect(link).not.toBeFocused()
  // with the link far down the page, at the very bottom of the window: behind the status line
  await link.evaluate((element) => {
    const { bottom } = element.getBoundingClientRect()
    window.scrollTo({ top: window.scrollY + bottom - window.innerHeight, behavior: 'instant' })
  })
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(statusLine.height)
  const behind = (await link.boundingBox())!
  expect(behind.y + behind.height).toBeGreaterThan(statusLine.y)

  await page.keyboard.press('Tab')
  await expect(link).toBeFocused()
  await expect
    .poll(async () => {
      const box = (await link.boundingBox())!
      return box.y + box.height
    })
    .toBeLessThanOrEqual(statusLine.y)
})
