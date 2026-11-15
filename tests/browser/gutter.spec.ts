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

for (const [name, viewport] of [
  ['on a phone', PHONE],
  ['on the narrowest phone', NARROWEST],
] as const) {
  test.describe(`the gutter of the docs theme ${name}`, () => {
    test.use({ viewport })

    for (const [path, content] of [
      ['/docs/sample/conditions', '.vp-doc'],
      ['/docs/sample/home', '.VPHero .main'],
    ] as const)
      test(`lines up ${path} with the brand and the lines of the menu button`, async ({ page }) => {
        await open(page, path)
        const edges = await page.evaluate((content) => {
          const box = (selector: string) =>
            document.querySelector(selector)!.getBoundingClientRect()
          return {
            brand: box('.VPNavBarTitle .title').left,
            menu: box('.VPNavBarHamburger .container').right,
            content: { left: box(content).left, right: box(content).right },
            localNav: document.querySelector('.VPLocalNav .menu-icon')?.getBoundingClientRect()
              .left,
          }
        }, content)
        expect(edges.brand).toBe(16)
        expect(edges.content).toEqual({ left: edges.brand, right: edges.menu })
        if (edges.localNav !== undefined) expect(edges.localNav).toBe(edges.brand)
      })
  })
}
