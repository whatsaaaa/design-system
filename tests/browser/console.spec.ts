import { type Page, expect, test } from '@playwright/test'
import { PAGES, open } from './pages.ts'

/**
 * Addresses with no page behind them. The server answers them with the 404 page, which knows
 * nothing of the address, and the app then shows the address that was asked for.
 */
const MISSING = ['/nope', '/lost/page']

/**
 * What the page reports while it loads: errors in the console, and uncaught errors.
 * `expected` names a report that is no fault of the page.
 */
function errorsOf(page: Page, expected?: (text: string, url: string) => boolean): string[] {
  const errors: string[] = []
  // the console of an embedded example is reported here too
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (!expected?.(message.text(), message.location().url)) errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(String(error)))
  return errors
}

/**
 * Every page comes up without an error in the console and without an uncaught error, in both
 * schemes. That covers Vue's report of a hydration mismatch: the first render in the browser
 * has to equal what the server sent, whatever theme the page comes up in.
 */
for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })

    for (const { name, path } of PAGES) {
      test(`${name} loads without an error`, async ({ page }) => {
        const errors = errorsOf(page)
        await open(page, path)
        expect(errors).toEqual([])
      })
    }

    for (const path of MISSING) {
      test(`the page for ${path}, which is not there, loads without an error of its own`, async ({
        page,
      }) => {
        // the browser itself reports that the address answered with 404. Nothing else may be.
        const errors = errorsOf(page, (text, url) => url.endsWith(path) && text.includes('404'))
        await open(page, path)
        // the path the visitor asked for, on the page and in the status line
        await expect(page.locator('.WsNotFound .ws-prompt').first()).toHaveText(`cat ${path}`)
        await expect(page.locator('.WsStatusLine .ws-status-line__file')).toHaveText(
          `${path.slice(1)}.md`,
        )
        expect(errors).toEqual([])
      })
    }
  })
}
