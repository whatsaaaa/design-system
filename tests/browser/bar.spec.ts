import { type Page, expect, test } from '@playwright/test'
import { open, settle } from './pages.ts'

/** The widths the sidebar is checked at: from just above where it shows to a wide screen. */
const WIDTHS = [1024, 1280, 1440, 1728, 1920]

const TAB = '.VPNavBarMenu > :is(.VPNavBarMenuLink, .VPNavBarMenuGroup)'

/** Where the sidebar ends and where each tab stands, in px from the left of the window. */
const measure = (page: Page) =>
  page.evaluate((selector) => {
    const sidebar = document.querySelector('.VPSidebar')
    const line = sidebar && getComputedStyle(sidebar)
    const tabs = [...document.querySelectorAll(selector)].map((tab) => {
      const box = tab.getBoundingClientRect()
      const style = getComputedStyle(tab)
      return {
        left: box.left,
        right: box.right,
        border: style.borderRightWidth,
        color: style.borderRightColor,
      }
    })
    return {
      sidebar: sidebar && {
        right: sidebar.getBoundingClientRect().right,
        border: line!.borderRightWidth,
        color: line!.borderRightColor,
      },
      tabs,
      brand: document.querySelector('.VPNavBarTitle .title')!.getBoundingClientRect().right,
      // the rule under the bar
      rule: document.querySelector('.VPNavBar .divider-line')!.getBoundingClientRect().left,
    }
  }, TAB)

const rename = (page: Page, text: string) =>
  page
    .locator(`${TAB} span`)
    .first()
    .evaluate((label, name) => {
      label.textContent = name
    }, text)

for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(`the sidebar and the first tab, ${colorScheme}`, () => {
    test.use({ colorScheme })

    for (const width of WIDTHS) {
      test(`are one vertical line at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await open(page, '/identity/')
        await expect(page.locator('.VPSidebar')).toBeVisible()

        const { sidebar, tabs, rule } = await measure(page)
        // the border of the sidebar and the border of the current first tab: the same pixels
        expect(tabs[0]!.right).toBe(sidebar!.right)
        expect(tabs[0]!.border).toBe(sidebar!.border)
        expect(tabs[0]!.color).toBe(sidebar!.color)
        // one length places both, so the line sits on a whole pixel
        expect(Number.isInteger(sidebar!.right)).toBe(true)
        // the rule under the bar starts at that line, and leaves the brand open to the sidebar
        expect(rule).toBe(sidebar!.right)

        // the line does not depend on what the first tab is called: shorter, or longer
        for (const label of ['api', 'reference']) {
          await rename(page, label)
          await settle(page)
          const renamed = await measure(page)
          expect(renamed.tabs[0]!.right, label).toBe(sidebar!.right)
          expect(renamed.sidebar!.right, label).toBe(sidebar!.right)
          // the tabs after it stay where they are
          expect(renamed.tabs[1]!.left, label).toBe(tabs[1]!.left)
          // and the brand keeps its room
          expect(renamed.brand, label).toBeLessThanOrEqual(renamed.tabs[0]!.left)
        }
      })

      test(`the tabs stand at the same place with and without a sidebar at ${width} px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 })
        await open(page, '/identity/')
        const withSidebar = await measure(page)
        // the overview has no sidebar
        await open(page, '/')
        await expect(page.locator('.VPSidebar')).toHaveCount(0)
        const without = await measure(page)
        expect(without.tabs.map(({ left, right }) => [left, right])).toEqual(
          withSidebar.tabs.map(({ left, right }) => [left, right]),
        )
      })
    }

    test('the second tab, when it is the current one, starts on that line too', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await open(page, '/tokens/color')
      const { sidebar, tabs } = await measure(page)
      await expect(page.locator(TAB).nth(1)).toHaveClass(/active/)
      // its left border is the pixels of the sidebar's border
      expect(tabs[1]!.left).toBe(sidebar!.right - parseFloat(sidebar!.border))
    })

    test('a first tab too long for the room keeps the line, and the brand is cut before it', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await open(page, '/identity/')
      const { sidebar, brand } = await measure(page)
      // the brand and this label together are wider than the sidebar
      await rename(page, 'getting started')
      await settle(page)
      const { tabs, brand: cut } = await measure(page)
      expect(tabs[0]!.right).toBe(sidebar!.right)
      // the brand ends a gap before the tab, and says that it is cut
      expect(cut).toBeLessThan(brand)
      expect(cut).toBe(tabs[0]!.left - 16)
      const name = page.locator('.VPNavBarTitle .title > span')
      expect(
        await name.evaluate((span) => ({
          cut: span.scrollWidth > span.clientWidth,
          mark: getComputedStyle(span).textOverflow,
        })),
      ).toEqual({ cut: true, mark: 'ellipsis' })
    })

    test('a first tab wider than the whole box is cut, and stays in the bar', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await open(page, '/identity/')
      const { sidebar } = await measure(page)
      await rename(page, 'everything there is to know about the identity')
      await settle(page)
      const { tabs } = await measure(page)
      expect(tabs[0]!.right).toBe(sidebar!.right)
      // it starts where the brand does, at the padding of the bar
      expect(tabs[0]!.left).toBe(20)
      const label = page.locator(`${TAB} span`).first()
      expect(await label.evaluate((span) => span.scrollWidth > span.clientWidth)).toBe(true)
    })
  })
}
