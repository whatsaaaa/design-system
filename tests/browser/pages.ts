import type { Page } from '@playwright/test'

/** Every page of the style guide, and the two standalone examples. */
export const PAGES = [
  { name: 'overview', path: '/' },
  { name: 'identity-ghost', path: '/identity/' },
  { name: 'identity-projects', path: '/identity/projects' },
  { name: 'identity-banners', path: '/identity/banners' },
  { name: 'tokens-color', path: '/tokens/color' },
  { name: 'tokens-typography', path: '/tokens/typography' },
  { name: 'tokens-space', path: '/tokens/space' },
  { name: 'styles-prose', path: '/styles/prose' },
  { name: 'styles-terminal', path: '/styles/terminal' },
  { name: 'docs-theme', path: '/docs/' },
  { name: 'docs-usage', path: '/docs/usage' },
  { name: 'docs-sample', path: '/docs/sample/conditions' },
  { name: 'docs-sample-home', path: '/docs/sample/home' },
  { name: 'example-terminal', path: '/examples/terminal.html' },
  { name: 'example-prose', path: '/examples/prose.html' },
] as const

export const PHONE = { width: 390, height: 844 }
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
    })
  }
}
