import { execFile } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { expect, test } from '@playwright/test'

const ORIGIN = 'http://docs-site.test'
const root = resolve(import.meta.dirname, '../..')
const site = join(root, 'tests/fixtures/docs-site')

/**
 * The 404 page of a docs site on the theme, the one the unit tests build, served as a static
 * host serves it: a file for each address it has, and the 404 page for one it does not. The site
 * is built at the root of its host, as a site with no base is, and under a base, as on GitHub
 * Pages. One worker runs the tests here in order and builds it once for each: two builds of the
 * site at once would share its .vitepress/.temp.
 */
test.describe.configure({ mode: 'default' })

for (const base of ['/', '/kafana/']) {
  test.describe(`a docs site served from ${base}`, () => {
    let out = ''

    test.beforeAll(async () => {
      test.setTimeout(120_000)
      out = mkdtempSync(join(tmpdir(), 'ws-docs-site-'))
      await promisify(execFile)(
        process.execPath,
        ['node_modules/vitepress/bin/vitepress.js', 'build', site, '--outDir', out, '--base', base],
        { cwd: root },
      )
    })
    test.afterAll(() => {
      rmSync(out, { recursive: true, force: true })
      rmSync(join(site, '.vitepress/cache'), { recursive: true, force: true })
    })

    test.beforeEach(async ({ context }) => {
      await context.route(`${ORIGIN}/**`, (route) => {
        const { pathname } = new URL(route.request().url())
        const path = pathname.slice(base.length)
        const names = !pathname.startsWith(base)
          ? []
          : path === '' || path.endsWith('/')
            ? [`${path}index.html`]
            : [path, `${path}.html`]
        const file = names
          .map((name) => join(out, name))
          .find((name) => existsSync(name) && statSync(name).isFile())
        return file
          ? route.fulfill({ path: file })
          : route.fulfill({ status: 404, path: join(out, '404.html') })
      })
    })

    for (const path of ['/nope', '/lost/page']) {
      test(`names ${path}, which is not there, by its path inside the site`, async ({ page }) => {
        await page.goto(`${ORIGIN}${base}${path.slice(1)}`)
        // the page and the status line name it the way they name the path of any page
        await expect(page.locator('.WsNotFound .ws-prompt').first()).toHaveText(`cat ${path}`)
        await expect(page.locator('.WsStatusLine .ws-status-line__file')).toHaveText(
          `${path.slice(1)}.md`,
        )
        // and the way back leads to the start of the site, under its base
        await expect(page.getByRole('link', { name: 'cd ~' })).toHaveAttribute('href', base)
      })
    }
  })
}
