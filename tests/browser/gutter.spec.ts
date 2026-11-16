import { expect, test } from '@playwright/test'
import { NARROWEST, PHONE, open } from './pages.ts'

/**
 * The gutter of a phone: below 64rem the content of a window starts where the brand of the
 * tab bar does, and ends where the end of the bar does, to the pixel.
 */
const PAGES = [
  ['/examples/terminal.html', '.pane'],
  ['/examples/prose.html', '.article .ws-prose'],
  ['/examples/form.html', '.form-page'],
] as const

for (const [name, viewport] of [
  ['on a phone', PHONE],
  ['on the narrowest phone', NARROWEST],
  ['on a tablet', { width: 768, height: 1024 }],
] as const) {
  test.describe(`the gutter ${name}`, () => {
    test.use({ viewport })

    for (const [path, content] of PAGES)
      test(`lines the content of ${path} up with the tab bar`, async ({ page }) => {
        await open(page, path)
        const edges = await page.evaluate((content) => {
          /** The edges of the content box of an element: inside its border and padding. */
          const inside = (element: Element) => {
            const box = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return {
              left: box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
              right:
                box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
            }
          }
          const brand = inside(document.querySelector('.ws-tab-bar__brand')!)
          const end = inside(document.querySelector('.ws-tab-bar__end')!)
          return {
            bar: { left: brand.left, right: end.right },
            content: inside(document.querySelector(content)!),
          }
        }, content)
        expect(edges.content).toEqual(edges.bar)
      })
  })
}

/** Below 48rem the docs theme lays out for a phone, up to the widest of them. */
for (const [name, viewport] of [
  ['on a phone', PHONE],
  ['on the narrowest phone', NARROWEST],
  ['just below 48rem', { width: 700, height: 1024 }],
] as const) {
  test.describe(`the gutter of the docs theme ${name}`, () => {
    test.use({ viewport })

    for (const [path, content] of [
      ['/docs/sample/conditions', '.vp-doc'],
      ['/docs/sample/home', '.VPHero .main'],
      ['/docs/sample/home', '.VPFeatures .container'],
      ['/docs/sample/home', '.VPHome > .vp-doc p'],
      ['/nope', '.WsNotFound'],
    ] as const)
      test(`lines up ${content} of ${path} with the brand and the lines of the menu button`, async ({
        page,
      }) => {
        await open(page, path)
        // the server sends the page of an address that is not there empty, and the app draws it
        await expect(page.locator(content)).toBeVisible()
        const edges = await page.evaluate((content) => {
          const box = (selector: string) =>
            document.querySelector(selector)!.getBoundingClientRect()
          /** The edges of the content box of an element: inside its border and padding. */
          const inside = (element: Element) => {
            const box = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return {
              left: box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
              right:
                box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight),
            }
          }
          return {
            brand: inside(document.querySelector('.VPNavBarTitle .title')!).left,
            menu: box('.VPNavBarHamburger .container').right,
            content: inside(document.querySelector(content)!),
            localNav: document.querySelector('.VPLocalNav .menu-icon')?.getBoundingClientRect()
              .left,
            width: { page: document.documentElement.scrollWidth, window: innerWidth },
          }
        }, content)
        expect(edges.brand).toBe(16)
        expect(edges.content).toEqual({ left: edges.brand, right: edges.menu })
        // nothing reaches past the edges of the window, such as the image of a hero
        expect(edges.width.page).toBe(edges.width.window)
        if (edges.localNav !== undefined) expect(edges.localNav).toBe(edges.brand)
      })
  })
}

/**
 * A project's mark as the logo of a docs site: its pixels start where the page does on a phone,
 * and where the sidebar's headings do from 60rem up, with the site's title after it and without
 * one. Its file keeps two empty sprite columns on each side, an eighth of its width, which the
 * theme pulls out. The style guide has no logo, so the test puts in the one the guide tells a
 * site to use.
 */
for (const [name, viewport, edge] of [
  ['on the narrowest phone', NARROWEST, '.vp-doc'],
  ['on a phone', PHONE, '.vp-doc'],
  ['just below 48rem', { width: 700, height: 1024 }, '.vp-doc'],
  ['on a wide screen', { width: 1440, height: 900 }, '.VPSidebarItem.level-0 > .item .text'],
] as const) {
  for (const title of [true, false])
    test(`the mark of a docs site lines up with the page ${name}${title ? '' : ', without a site title'}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await open(page, '/docs/sample/conditions')
      const edges = await page.evaluate(
        async ({ edge, title }) => {
          const brand = document.querySelector('.VPNavBarTitle .title')!
          const logo = document.createElement('img')
          logo.className = 'VPImage logo'
          logo.alt = ''
          logo.src = '/kit/form-builder/mark-on-dark.svg'
          brand.prepend(logo)
          // themeConfig.siteTitle: false leaves the mark alone in the link
          if (!title) brand.querySelector(':scope > span')!.remove()
          await logo.decode()
          const box = logo.getBoundingClientRect()
          const content = document.querySelector(edge)!
          const style = getComputedStyle(content)
          return {
            mark: box.left + box.width / 8,
            size: { width: box.width, height: box.height },
            content: content.getBoundingClientRect().left + parseFloat(style.paddingLeft),
          }
        },
        { edge, title },
      )
      expect(edges.size).toEqual({ width: 32, height: 32 })
      expect(edges.mark).toBe(edges.content)
    })
}
