import { expect, test } from '@playwright/test'
import { PAGES, open } from './pages.ts'

test.describe('the asset kit on the page', () => {
  test('a file without a preview says so on the page background, where the note reads', async ({
    page,
  }) => {
    await open(page, '/identity/banners')
    const preview = page.locator('.kit .card', { hasText: 'favicon.ico' }).locator('.preview')
    await expect(preview).toHaveText('no preview')
    const background = (element: Element) => {
      const style = getComputedStyle(element)
      return `${style.backgroundImage} ${style.backgroundColor}`
    }
    expect(await preview.evaluate(background)).toBe(
      `none ${await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)}`,
    )
  })
})

test.describe('links to a section', () => {
  /** The sections the page links to, as the id each link expects by the page it is on. */
  const sections = () => {
    const byPage: Record<string, string[]> = {}
    for (const link of document.querySelectorAll<HTMLAnchorElement>('.vp-doc a[href*="#"]')) {
      if (link.origin !== location.origin || link.hash.length < 2) continue
      ;(byPage[link.pathname] ??= []).push(decodeURIComponent(link.hash.slice(1)))
    }
    return byPage
  }
  const missing = (ids: string[]) => ids.filter((id) => !document.getElementById(id))

  for (const { name, path } of PAGES.filter((entry) => !entry.path.startsWith('/examples/'))) {
    test(`${name}: every one lands on a section that exists`, async ({ page }) => {
      await open(page, path)
      for (const [target, ids] of Object.entries(await page.evaluate(sections))) {
        await page.goto(target)
        expect(await page.evaluate(missing, ids), `sections of ${target}`).toEqual([])
      }
    })
  }
})
