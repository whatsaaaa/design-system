import { expect, test } from '@playwright/test'
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

  test('a theme chosen by hand wins over the system', async ({ page }) => {
    await open(page, '/')
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    // the system still asks for dark
    expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true)
    expect(await color(page, 'body', 'backgroundColor')).toBe('rgb(250, 244, 237)')
  })
})
