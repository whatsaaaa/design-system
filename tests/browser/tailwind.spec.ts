import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type Browser, type Page, expect, test } from '@playwright/test'
import { buildTailwindApp } from '../fixtures/tailwind-app/build.ts'

/**
 * An app on Tailwind CSS v4 that imports tailwind.css as the usage guide says, built and served
 * as it would be: its utilities on the tokens, and the dark: and light: variants. Each worker
 * builds it once.
 */
const ORIGIN = 'http://tailwind-app.test'
let out = ''

test.beforeAll(async () => {
  out = mkdtempSync(join(tmpdir(), 'ws-tailwind-app-'))
  await buildTailwindApp(out)
})
test.afterAll(() => rmSync(out, { recursive: true, force: true }))

/** The built app in a page of its own, with the system's color scheme given. */
async function app(browser: Browser, colorScheme: 'dark' | 'light') {
  const context = await browser.newContext({ colorScheme })
  await context.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname
    return route.fulfill({ path: join(out, path === '/' ? 'index.html' : path) })
  })
  const page = await context.newPage()
  await page.goto(`${ORIGIN}/`)
  await page.evaluate(() => document.fonts.ready)
  return { context, page }
}

const style = (page: Page, selector: string) =>
  page.locator(selector).evaluate((element) => {
    const { backgroundColor, color, fontFamily, fontSize, borderRadius, height, padding } =
      getComputedStyle(element)
    return { backgroundColor, color, fontFamily, fontSize, borderRadius, height, padding }
  })

const THEMES = {
  dark: { bg: 'rgb(25, 23, 36)', surface: 'rgb(31, 29, 46)', interactive: 'rgb(156, 207, 216)' },
  light: {
    bg: 'rgb(250, 244, 237)',
    surface: 'rgb(255, 250, 243)',
    interactive: 'rgb(40, 105, 131)',
  },
} as const

test.describe('an app on tailwind.css', () => {
  for (const colorScheme of ['dark', 'light'] as const)
    test(`colors its utilities with the roles of the theme, ${colorScheme}`, async ({
      browser,
    }) => {
      const { context, page } = await app(browser, colorScheme)
      const theme = THEMES[colorScheme]
      expect((await style(page, 'body')).backgroundColor).toBe(theme.bg)
      expect((await style(page, '#card')).backgroundColor).toBe(theme.surface)
      expect((await style(page, '#button')).backgroundColor).toBe(theme.interactive)
      await expect(page.locator('#theme')).toHaveText(
        `tema: ${colorScheme === 'dark' ? 'rose-pine' : 'rose-pine-dawn'}`,
        { useInnerText: true },
      )
      await context.close()
    })

  test('sets type, space, radius and sizes from the tokens', async ({ browser }) => {
    const { context, page } = await app(browser, 'dark')
    const title = await style(page, '#title')
    expect(title.fontFamily).toMatch(/^"JetBrains Mono"/)
    expect(title.fontSize).toBe('40px')
    expect((await style(page, '#lead')).fontFamily).toMatch(/^Inter/)
    const button = await style(page, '#button')
    expect(button.borderRadius).toBe('6px')
    expect(button.height).toBe('48px')
    expect((await style(page, '#card')).padding).toBe('24px')
    // the fonts are the package's own, served with the app
    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family),
    )
    expect(new Set(loaded)).toEqual(new Set(['Inter', 'JetBrains Mono']))
    await context.close()
  })

  test("takes the system's compact width below 64rem", async ({ browser }) => {
    const { context, page } = await app(browser, 'dark')
    await page.setViewportSize({ width: 390, height: 844 })
    expect((await style(page, '#title')).fontSize).toBe('32px')
    expect((await style(page, 'body')).padding).toBe('16px')
    await context.close()
  })
})

test.describe('the dark: and light: variants', () => {
  type Way = 'data-theme' | 'class'
  const held = (way: Way, theme: 'dark' | 'light') =>
    way === 'data-theme' ? `data-theme="${theme}"` : `class="${theme}"`
  /** The theme names of the app, as the variants show them, in parts held in a theme and nested. */
  const name = (id: string) =>
    `<p id="${id}"><span class="hidden dark:inline">dark</span><span class="hidden light:inline">light</span></p>`
  const fixture = (way: Way) => `
    <div id="fixture">
      ${name('page')}
      <div ${held(way, 'light')}>
        ${name('light')}
        <div ${held(way, 'dark')}>
          ${name('nested')}
          <div ${held(way, 'light')}>${name('deeper')}</div>
        </div>
      </div>
      <div ${held(way, 'dark')}>${name('dark')}</div>
      <div data-theme="dark" class="light">${name('both-ways')}</div>
      <div class="dark light">${name('both-classes')}</div>
    </div>`

  /** The name each part of the fixture shows, or the names, where more than one shows. */
  const shown = (page: Page, way: Way) =>
    page.evaluate((markup) => {
      document.querySelector('#fixture')?.remove()
      document.body.insertAdjacentHTML('beforeend', markup)
      return Object.fromEntries(
        [...document.querySelectorAll<HTMLElement>('#fixture p')].map((part) => [
          part.id,
          [...part.children]
            .filter((child) => child.getClientRects().length > 0)
            .map((child) => child.textContent)
            .join(' '),
        ]),
      )
    }, fixture(way))

  for (const way of ['data-theme', 'class'] as const)
    for (const [colorScheme, chosen, page] of [
      ['dark', undefined, 'dark'],
      ['light', undefined, 'light'],
      ['dark', 'light', 'light'],
      ['light', 'dark', 'dark'],
    ] as const)
      test(`follow the nearest choice, made with ${way}: ${chosen ?? 'no'} theme chosen on a ${colorScheme} system`, async ({
        browser,
      }) => {
        const { context, page: tab } = await app(browser, colorScheme)
        if (chosen)
          await tab.evaluate(
            ([way, theme]) => {
              const root = document.documentElement
              if (way === 'class') root.classList.add(theme)
              else root.dataset.theme = theme
            },
            [way, chosen] as const,
          )
        expect(await shown(tab, way)).toEqual({
          page,
          light: 'light',
          nested: 'dark',
          deeper: 'light',
          dark: 'dark',
          // data-theme wins over the class on one element
          'both-ways': 'dark',
          // both classes choose nothing, so the theme around them holds
          'both-classes': page,
        })
        await context.close()
      })

  test('take data-theme over the class on <html>', async ({ browser }) => {
    const { context, page } = await app(browser, 'dark')
    await page.evaluate(() => {
      document.documentElement.className = 'dark'
      document.documentElement.dataset.theme = 'light'
    })
    await expect(page.locator('#theme')).toHaveText('tema: rose-pine-dawn', { useInnerText: true })
    expect((await style(page, 'body')).backgroundColor).toBe(THEMES.light.bg)
    await context.close()
  })
})
