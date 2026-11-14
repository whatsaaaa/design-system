import { expect, test } from '@playwright/test'
import { wcagContrast } from 'culori'
import { open } from './pages.ts'

const color = (page: import('@playwright/test').Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element, name) => getComputedStyle(element)[name as 'color'], property)

test.describe('themes', () => {
  test('dark is Rosé Pine main', async ({ page }) => {
    await open(page, '/docs/sample/conditions')
    expect(await color(page, 'body', 'backgroundColor')).toBe('rgb(25, 23, 36)')
    expect(await color(page, '.vp-doc h1', 'color')).toBe('rgb(224, 222, 244)')
    expect(await color(page, '.vp-doc p a', 'color')).toBe('rgb(156, 207, 216)')
  })

  test.describe('when the system asks for light', () => {
    test.use({ colorScheme: 'light' })

    test('light is Rosé Pine Dawn', async ({ page }) => {
      await open(page, '/docs/sample/conditions')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      expect(await color(page, 'body', 'backgroundColor')).toBe('rgb(250, 244, 237)')
      expect(await color(page, '.vp-doc h1', 'color')).toBe('rgb(87, 82, 121)')
      expect(await color(page, '.vp-doc p a', 'color')).toBe('rgb(40, 105, 131)')
    })

    test('code blocks stay dark', async ({ page }) => {
      await open(page, '/docs/sample/conditions')
      expect(await color(page, '.vp-doc div[class*="language-"]', 'backgroundColor')).toBe(
        'rgb(31, 29, 46)',
      )
      expect(await color(page, '.vp-doc div[class*="language-"] code', 'color')).toBe(
        'rgb(224, 222, 244)',
      )
    })

    test('a code block in a callout stays dark too, also one without a language', async ({
      page,
    }) => {
      await open(page, '/styles/prose')
      // a block without a language has no colors of its own: every token takes the color of the block
      const plain = '.vp-doc .custom-block div[class*="language-"]'
      await expect(page.locator(`${plain} code span[style]`)).toHaveCount(0)
      expect(await color(page, plain, 'backgroundColor')).toBe('rgb(31, 29, 46)')
      expect(await color(page, `${plain} code`, 'color')).toBe('rgb(224, 222, 244)')
    })

    test('a callout label takes the text color, and its bar keeps the hue', async ({ page }) => {
      await open(page, '/docs/sample/conditions')
      expect(await color(page, '.custom-block.warning .custom-block-title', 'color')).toBe(
        'rgb(87, 82, 121)',
      )
      expect(await color(page, '.custom-block.warning', 'borderLeftColor')).toBe(
        'rgb(234, 157, 52)',
      )
    })

    test('a plain page follows the system without any script', async ({ browser }) => {
      const context = await browser.newContext({ colorScheme: 'light', javaScriptEnabled: false })
      const page = await context.newPage()
      await page.goto('/examples/prose.html')
      expect(await color(page, 'body', 'backgroundColor')).toBe('rgb(250, 244, 237)')
      await context.close()
    })

    test('a sample of the contrast table stands on what its pair is measured on', async ({
      page,
    }) => {
      await open(page, '/tokens/color')
      // code on a highlighted line is measured on the code background, dark in both themes
      const row = page.locator('tr', {
        hasText: 'code.line-highlight',
        has: page.locator('.sample'),
      })
      for (const theme of ['dark', 'light'])
        expect(
          await row
            .locator(`.sample[data-theme="${theme}"]`)
            .evaluate((sample) => getComputedStyle(sample).backgroundColor),
          theme,
        ).toBe('rgb(31, 29, 46)')
    })

    test('a part of a page can be held in one theme', async ({ page }) => {
      await open(page, '/tokens/color')
      // the samples of the contrast table are drawn in their own theme
      expect(await color(page, '.sample[data-theme="dark"]', 'backgroundColor')).toBe(
        'rgb(25, 23, 36)',
      )
      expect(await color(page, '.sample[data-theme="light"]', 'backgroundColor')).toBe(
        'rgb(250, 244, 237)',
      )
    })
  })

  for (const [colorScheme, text, link] of [
    ['dark', 'rgb(224, 222, 244)', 'rgb(156, 207, 216)'],
    ['light', 'rgb(87, 82, 121)', 'rgb(40, 105, 131)'],
  ] as const) {
    test.describe(`inline code in a callout, ${colorScheme}`, () => {
      test.use({ colorScheme })

      test('takes the text color in every kind of callout, and reads on its chip', async ({
        page,
      }) => {
        await open(page, '/docs/sample/conditions')
        // every kind VitePress draws, put on a callout of the page in turn
        const kinds = [
          'info',
          'note',
          'tip',
          'important',
          'warning',
          'danger',
          'caution',
          'details',
        ]
        const drawn = await page
          .locator('.custom-block:has(p > code)')
          .first()
          .evaluate((block, names) => {
            const code = block.querySelector('p > code')!
            return names.map((kind) => {
              block.setAttribute('class', `${kind} custom-block`)
              const style = getComputedStyle(code)
              return { kind, color: style.color, chip: style.backgroundColor }
            })
          }, kinds)
        expect(drawn.map(({ kind, color }) => [kind, color])).toEqual(
          kinds.map((kind) => [kind, text]),
        )
        for (const { kind, color, chip } of drawn) {
          expect(chip, kind).toMatch(/^rgb\(/)
          expect(wcagContrast(color, chip), kind).toBeGreaterThanOrEqual(4.5)
        }
      })

      test('keeps the link color when it is a link, also under the pointer', async ({ page }) => {
        await open(page, '/docs/sample/conditions')
        const paragraph = page.locator('.custom-block.warning p').last()
        await paragraph.evaluate((element) =>
          element.insertAdjacentHTML('beforeend', ' <a href="#effects"><code>affects</code></a>'),
        )
        const code = paragraph.locator('a > code')
        const shown = () => code.evaluate((element) => getComputedStyle(element).color)
        expect(await shown()).toBe(link)
        await code.hover()
        expect(await shown()).toBe(link)
      })
    })
  }

  test.describe('the name of the theme in the status line', () => {
    const name = (page: import('@playwright/test').Page, theme: 'dark' | 'light') =>
      page.locator(`.WsStatusLine .ws-theme-${theme}`)

    /** The page as the server sends it, with its head scripts run and the app never arriving. */
    async function beforeTheApp(
      browser: import('@playwright/test').Browser,
      colorScheme: 'dark' | 'light',
      remembered?: 'dark' | 'light',
    ) {
      const context = await browser.newContext({ colorScheme })
      if (remembered)
        await context.addInitScript(
          (appearance) => localStorage.setItem('vitepress-theme-appearance', appearance),
          remembered,
        )
      const page = await context.newPage()
      await page.route('**/assets/**/*.js', (route) => route.abort())
      await page.goto('/docs/sample/conditions')
      return { context, page }
    }

    for (const [colorScheme, other] of [
      ['dark', 'light'],
      ['light', 'dark'],
    ] as const) {
      test(`is the theme of the page before the app runs, ${colorScheme}`, async ({ browser }) => {
        const { context, page } = await beforeTheApp(browser, colorScheme)
        await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme)
        await expect(name(page, colorScheme)).toBeVisible()
        await expect(name(page, other)).toBeHidden()
        await context.close()
      })

      test(`is the theme chosen by hand before the app runs, ${other} on a ${colorScheme} system`, async ({
        browser,
      }) => {
        const { context, page } = await beforeTheApp(browser, colorScheme, other)
        await expect(page.locator('html')).toHaveAttribute('data-theme', other)
        await expect(name(page, other)).toBeVisible()
        await expect(name(page, colorScheme)).toBeHidden()
        await context.close()
      })
    }

    test('follows the switch of the nav bar', async ({ page }) => {
      // below 80rem the switch of the default theme is in the menu at the end of the bar
      await page.setViewportSize({ width: 1100, height: 800 })
      await open(page, '/docs/sample/conditions')
      await expect(name(page, 'dark')).toHaveText('rose-pine')
      await expect(name(page, 'light')).toBeHidden()
      await page.locator('.VPNavBarExtra').hover()
      await page.locator('.VPNavBarExtra .VPSwitchAppearance').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await expect(name(page, 'light')).toHaveText('rose-pine-dawn')
      await expect(name(page, 'dark')).toBeHidden()
    })
  })

  test('a theme chosen by hand wins over the system', async ({ page }) => {
    await open(page, '/')
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    // the system still asks for dark
    expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true)
    expect(await color(page, 'body', 'backgroundColor')).toBe('rgb(250, 244, 237)')
  })
})

test.describe('an element for one theme only', () => {
  /**
   * One element of each theme on the page, in a part of it held light, in a dark part inside
   * that, and in a part held dark. The status line's older names for the classes are there too.
   */
  const FIXTURE = `
    <div id="fixture">
      <span id="page-dark" class="ws-theme-dark"></span>
      <span id="page-light" class="ws-theme-light"></span>
      <span id="old-dark" class="ws-status-line__item ws-status-line__item--dark"></span>
      <span id="old-light" class="ws-status-line__item ws-status-line__item--light"></span>
      <div data-theme="light">
        <span id="light-dark" class="ws-theme-dark"></span>
        <span id="light-light" class="ws-theme-light"></span>
        <div data-theme="dark">
          <span id="nested-dark" class="ws-theme-dark"></span>
          <span id="nested-light" class="ws-theme-light"></span>
        </div>
      </div>
      <div data-theme="dark">
        <span id="dark-dark" class="ws-theme-dark"></span>
        <span id="dark-light" class="ws-theme-light"></span>
      </div>
      <span id="own-light" class="ws-theme-dark" data-theme="light"></span>
    </div>`

  /** The elements of the fixture that show, each made a box so a shown one has one. */
  const shown = (page: import('@playwright/test').Page) =>
    page.evaluate((fixture) => {
      document.querySelector('#fixture')?.remove()
      document.body.insertAdjacentHTML('beforeend', fixture)
      const elements = [...document.querySelectorAll<HTMLElement>('#fixture span')]
      for (const element of elements) element.style.cssText = 'width: 1px; height: 1px'
      return elements.filter((element) => element.getClientRects().length > 0).map(({ id }) => id)
    }, FIXTURE)

  for (const [colorScheme, chosen, page] of [
    ['dark', undefined, 'dark'],
    ['light', undefined, 'light'],
    ['dark', 'light', 'light'],
    ['light', 'dark', 'dark'],
  ] as const) {
    test(`shows where its theme applies: ${chosen ?? 'no'} theme chosen on a ${colorScheme} system`, async ({
      browser,
    }) => {
      // a plain page, with no script of the system's: the styles alone do it
      const context = await browser.newContext({ colorScheme })
      const tab = await context.newPage()
      await tab.route('**/example.js', (route) => route.abort())
      await tab.route('**/init.js', (route) => route.abort())
      await tab.goto('/examples/terminal.html')
      if (chosen)
        await tab.evaluate((theme) => (document.documentElement.dataset.theme = theme), chosen)
      expect(await shown(tab)).toEqual([
        `page-${page}`,
        `old-${page}`,
        'light-light',
        'nested-dark',
        'dark-dark',
      ])
      await context.close()
    })
  }

  test('changes with the theme, at once', async ({ page }) => {
    await open(page, '/examples/terminal.html')
    expect(await shown(page)).toContain('page-dark')
    await page.locator('.ws-status-line__theme').click()
    expect(await shown(page)).toContain('page-light')
    expect(await shown(page)).not.toContain('page-dark')
  })
})

test.describe("the color of the browser's own bars", () => {
  const DARK = '#191724'
  const LIGHT = '#faf4ed'
  const themeColor = (page: import('@playwright/test').Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map(
        (tag) => tag.content,
      ),
    )

  test('is the background of the theme shown, chosen by hand and after a reload', async ({
    page,
  }) => {
    await open(page, '/examples/terminal.html')
    expect(await themeColor(page)).toEqual([DARK])
    await page.locator('.ws-status-line__theme').click()
    await expect.poll(() => themeColor(page)).toEqual([LIGHT])
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect.poll(() => themeColor(page)).toEqual([LIGHT])
    // and with the key, on the next page
    await page.keyboard.press('t')
    await expect.poll(() => themeColor(page)).toEqual([DARK])
    await page.locator('.ws-tabs a', { hasText: 'writing' }).click()
    await expect(page).toHaveURL(/\/examples\/prose\.html/)
    await expect.poll(() => themeColor(page)).toEqual([DARK])
  })

  test('follows the system while the page does, and a choice by hand after that', async ({
    page,
  }) => {
    await open(page, '/examples/terminal.html')
    await page.emulateMedia({ colorScheme: 'light' })
    await expect.poll(() => themeColor(page)).toEqual([LIGHT])
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect.poll(() => themeColor(page)).toEqual([DARK])
    // chosen by hand, the system no longer decides
    await page.locator('.ws-status-line__theme').click()
    await expect.poll(() => themeColor(page)).toEqual([LIGHT])
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(100)
    expect(await themeColor(page)).toEqual([LIGHT])
  })

  test('is set from the head script alone, before the page has its module', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' })
    await context.addInitScript(() => localStorage.setItem('ws-theme', 'light'))
    const page = await context.newPage()
    await page.route('**/example.js', (route) => route.abort())
    await page.goto('/examples/terminal.html')
    await expect.poll(() => themeColor(page)).toEqual([LIGHT])
    await context.close()
  })

  test('follows the docs theme, its key and a reload', async ({ page }) => {
    await open(page, '/styles/prose')
    expect(await themeColor(page)).toEqual([DARK])
    await page.keyboard.press('t')
    await expect.poll(() => themeColor(page)).toEqual([LIGHT])
    await page.reload()
    await expect.poll(() => themeColor(page)).toEqual([LIGHT])
  })
})
