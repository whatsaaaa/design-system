import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Browser } from '@playwright/test'

/**
 * The plain gallery of `tests/fixtures/spec-gallery`, served under an origin of its own with the
 * built tokens and stylesheet, as an implementation's gallery is served with them.
 */
export const ORIGIN = 'http://spec-gallery.test'
const root = fileURLToPath(new URL('../..', import.meta.url))
const files: Record<string, string> = {
  '/': 'tests/fixtures/spec-gallery/index.html',
  '/gallery.css': 'tests/fixtures/spec-gallery/gallery.css',
  '/tokens.css': 'dist/tokens.css',
  '/tags.html': 'tests/fixtures/spec-gallery/tags.html',
  '/index.css': 'dist/index.css',
}

/** Opens the gallery in a context of its own, which the caller closes. */
export async function gallery(browser: Browser, options: { deviceScaleFactor?: number } = {}) {
  const context = await browser.newContext(options)
  await context.route(`${ORIGIN}/**`, (route) => {
    const file = files[new URL(route.request().url()).pathname]
    return file ? route.fulfill({ path: join(root, file) }) : route.fulfill({ status: 404 })
  })
  const page = await context.newPage()
  await page.goto(`${ORIGIN}/`)
  return { context, page }
}
