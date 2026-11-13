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
      page.locator(`.WsStatusLine .ws-status-line__item--${theme}`)

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
