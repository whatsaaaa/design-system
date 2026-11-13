import { type Page, expect, test } from '@playwright/test'
import { open, settle } from './pages.ts'

/** The widths the sidebar is checked at: from just above where it shows to a wide screen. */
const WIDTHS = [1024, 1280, 1440, 1728, 1920]

const TAB = '.VPNavBarMenu > :is(.VPNavBarMenuLink, .VPNavBarMenuGroup)'
const BRAND = '.VPNavBarTitle .title'

/** Where the sidebar ends and where the brand and each tab stand, in px from the left of the window. */
const measure = (page: Page) =>
  page.evaluate(
    (selector) => {
      const sidebar = document.querySelector('.VPSidebar')
      const line = sidebar && getComputedStyle(sidebar)
      const tabs = [...document.querySelectorAll(selector.tab)].map((tab) => {
        const box = tab.getBoundingClientRect()
        const style = getComputedStyle(tab)
        return {
          left: box.left,
          right: box.right,
          border: style.borderLeftWidth,
          color: style.borderLeftColor,
        }
      })
      const brand = document.querySelector(selector.brand)!.getBoundingClientRect()
      return {
        sidebar: sidebar && {
          right: sidebar.getBoundingClientRect().right,
          border: line!.borderRightWidth,
          color: line!.borderRightColor,
          // where the padding of the sidebar starts at its right, inside its border
          inside:
            sidebar.getBoundingClientRect().right -
            parseFloat(line!.borderRightWidth) -
            parseFloat(line!.paddingRight),
        },
        tabs,
        brand: { left: brand.left, right: brand.right },
        // the rule under the bar
        rule: document.querySelector('.VPNavBar .divider-line')!.getBoundingClientRect().left,
      }
    },
    { tab: TAB, brand: BRAND },
  )

const setText = (page: Page, selector: string, text: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((label, name) => {
      label.textContent = name
    }, text)
const renameTab = (page: Page, text: string) => setText(page, `${TAB} span`, text)
const renameBrand = (page: Page, text: string) => setText(page, `${BRAND} > span`, text)

/** Whether the name of the brand is cut, and how a cut is shown. */
const brandName = (page: Page) =>
  page.locator(`${BRAND} > span`).evaluate((span) => ({
    cut: span.scrollWidth > span.clientWidth,
    mark: getComputedStyle(span).textOverflow,
  }))

for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(`the sidebar and the first tab, ${colorScheme}`, () => {
    test.use({ colorScheme })

    for (const width of WIDTHS) {
      test(`are one vertical line at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await open(page, '/identity/')
        await expect(page.locator('.VPSidebar')).toBeVisible()

        const { sidebar, tabs, brand, rule } = await measure(page)
        // the border of the sidebar and the left border of the current first tab: the same pixels
        const line = sidebar!.right - parseFloat(sidebar!.border)
        expect(tabs[0]!.left).toBe(line)
        expect(tabs[0]!.border).toBe(sidebar!.border)
        expect(tabs[0]!.color).toBe(sidebar!.color)
        // one length places both, so the line sits on a whole pixel
        expect(Number.isInteger(line)).toBe(true)
        // the rule under the bar starts where the sidebar ends, and leaves the brand open to it
        expect(rule).toBe(sidebar!.right)

        // the line does not depend on what the first tab is called: shorter, or longer
        for (const label of ['api', 'getting started']) {
          await renameTab(page, label)
          await settle(page)
          const renamed = await measure(page)
          expect(renamed.tabs[0]!.left, label).toBe(line)
          expect(renamed.sidebar!.right, label).toBe(sidebar!.right)
          // the tabs after it follow it
          expect(renamed.tabs[1]!.left, label).toBe(renamed.tabs[0]!.right)
          // and the brand keeps its place and its room
          expect(renamed.brand, label).toEqual(brand)
        }
        // the long label pushed the later tabs along
        expect((await measure(page)).tabs[1]!.left).toBeGreaterThan(tabs[1]!.left)
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

    test('the brand has the width of the sidebar: a project name with its logo shows in full', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await open(page, '/identity/')
      const { tabs } = await measure(page)
      // a docs site of a project: its mark as the logo, and its name
      await page.locator(BRAND).evaluate((brand) => {
        const logo = document.createElement('img')
        logo.className = 'VPImage logo'
        logo.src = '/kit/building-blocks/mark-on-dark.svg'
        logo.alt = ''
        brand.prepend(logo)
      })
      await renameBrand(page, 'building-blocks')
      await settle(page)
      expect((await page.locator(`${BRAND} .logo`).boundingBox())!.width).toBe(32)
      expect((await brandName(page)).cut).toBe(false)
      const named = await measure(page)
      expect(named.brand.right).toBeLessThanOrEqual(named.sidebar!.inside)
      expect(named.tabs).toEqual(tabs)
    })

    test('a brand too long for its box is cut at the padding of the sidebar, before the tabs', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await open(page, '/identity/')
      const { tabs } = await measure(page)
      await renameBrand(page, 'the-whole-family-of-whatsaaaa-projects-in-one-place')
      await settle(page)
      const long = await measure(page)
      expect(await brandName(page)).toEqual({ cut: true, mark: 'ellipsis' })
      expect(long.brand.right).toBe(long.sidebar!.inside)
      expect(long.brand.right).toBeLessThan(long.tabs[0]!.left)
      expect(long.tabs).toEqual(tabs)
    })

    test('a short brand leaves a gap, and the tabs stay on the line', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await open(page, '/identity/')
      const { tabs } = await measure(page)
      await renameBrand(page, 'ds')
      await settle(page)
      const short = await measure(page)
      expect(short.brand.right).toBeLessThan(tabs[0]!.left)
      expect(short.tabs).toEqual(tabs)
    })
  })
}
