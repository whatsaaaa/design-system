import { expect, test } from '@playwright/test'
import { DESKTOP, PAGES, PHONE, open } from './pages.ts'

/**
 * How far the page scrolls sideways, and the elements that stick out of the window without
 * a scrolling container around them. Both have to be nothing. A container that only clips
 * does not count: what it cuts off cannot be reached.
 */
const measure = () => {
  const width = document.documentElement.clientWidth
  const sticking: string[] = []
  for (const element of document.querySelectorAll('body *')) {
    const box = element.getBoundingClientRect()
    if (box.width === 0 || box.height === 0 || box.right <= width + 0.5) continue
    let parent = element.parentElement
    let contained = false
    while (parent) {
      const style = getComputedStyle(parent)
      if (['auto', 'scroll'].includes(style.overflowX) || style.position === 'fixed') {
        contained = true
        break
      }
      parent = parent.parentElement
    }
    if (!contained)
      sticking.push(`${element.tagName.toLowerCase()}.${element.getAttribute('class') ?? ''}`)
  }
  return { scroll: document.documentElement.scrollWidth - width, sticking: sticking.slice(0, 5) }
}

for (const [viewportName, viewport] of [
  ['phone', PHONE],
  ['desktop', DESKTOP],
] as const) {
  for (const colorScheme of ['dark', 'light'] as const) {
    test.describe(`${viewportName}, ${colorScheme}`, () => {
      test.use({ viewport, colorScheme })

      for (const { name, path } of PAGES) {
        test(`${name} does not overflow sideways`, async ({ page }) => {
          await open(page, path)
          // the guide sets the theme by hand. A plain page follows the system with no attribute.
          if (!path.startsWith('/examples/'))
            await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme)
          expect(await page.evaluate(measure)).toEqual({ scroll: 0, sticking: [] })
          // an example embedded in the page must not overflow inside its frame either
          for (const frame of page.frames().slice(1))
            expect(await frame.evaluate(measure), frame.url()).toEqual({ scroll: 0, sticking: [] })
        })
      }
    })
  }
}
