import { expect, test } from '@playwright/test'
import { PAGES, open } from './pages.ts'

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
        const errors: string[] = []
        // the console of an embedded example is reported here too
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text())
        })
        page.on('pageerror', (error) => errors.push(String(error)))
        await open(page, path)
        expect(errors).toEqual([])
      })
    }
  })
}
