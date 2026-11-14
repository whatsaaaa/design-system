import type { Page } from '@playwright/test'

/**
 * Every page of the style guide, and the standalone examples.
 *
 * `shots` says which screenshots a page has. Every page is checked for overflow at the width
 * of the narrowest phone, a phone, a tablet and a desktop. Screenshots are kept to what a look can go wrong on: all pages at desktop width,
 * and at phone width the pages that differ there beyond their column getting narrow.
 * The usage guide is prose only, which the prose page already shows.
 */
export const PAGES = [
  { name: 'overview', path: '/', shots: 'all' },
  { name: 'identity-ghost', path: '/identity/', shots: 'all' },
  { name: 'identity-projects', path: '/identity/projects', shots: 'desktop' },
  { name: 'identity-banners', path: '/identity/banners', shots: 'desktop' },
  { name: 'tokens-color', path: '/tokens/color', shots: 'desktop' },
  { name: 'tokens-typography', path: '/tokens/typography', shots: 'desktop' },
  { name: 'tokens-space', path: '/tokens/space', shots: 'all' },
  { name: 'styles-prose', path: '/styles/prose', shots: 'all' },
  { name: 'styles-terminal', path: '/styles/terminal', shots: 'all' },
  { name: 'styles-forms', path: '/styles/forms', shots: 'all' },
  { name: 'docs-theme', path: '/docs/', shots: 'desktop' },
  { name: 'docs-usage', path: '/docs/usage', shots: 'none' },
  { name: 'docs-sample', path: '/docs/sample/conditions', shots: 'all' },
  { name: 'docs-sample-home', path: '/docs/sample/home', shots: 'all' },
  { name: 'example-terminal', path: '/examples/terminal.html', shots: 'all' },
  { name: 'example-prose', path: '/examples/prose.html', shots: 'all' },
  { name: 'example-form', path: '/examples/form.html', shots: 'all' },
] as const

export const PHONE = { width: 390, height: 844 }
/** The narrowest phone a page is made for. */
export const NARROWEST = { width: 320, height: 640 }
/** The narrowest window that has the tabs in the bar, next to everything else in it. */
export const TABLET = { width: 768, height: 1024 }
export const DESKTOP = { width: 1440, height: 900 }

/** Opens a page and waits until it is settled: fonts, images and embedded examples. */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await settle(page)
}

export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('load')
  for (const frame of page.frames()) {
    await frame.waitForLoadState('load')
    await frame.evaluate(async () => {
      await document.fonts.ready
      await Promise.all(
        [...document.images].map((image) =>
          image.complete ? undefined : image.decode().catch(() => undefined),
        ),
      )
      // two frames, so what reacts to a new layout or a new window size has reacted and is painted
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
  }
}
