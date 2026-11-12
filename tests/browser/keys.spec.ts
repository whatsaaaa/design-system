import { expect, test } from '@playwright/test'
import { PHONE, open } from './pages.ts'

const theme = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.dataset.theme)

test.describe('the keys of the status line', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, '/styles/prose')
  })

  test('every hint that is shown names a control', async ({ page }) => {
    const hints = page.locator('.ws-status-line__keys')
    await expect(hints).toBeVisible()
    await expect(hints.locator('[data-ws-key]')).toHaveCount(4)
    for (const key of ['/', 'j', 'k', 't'])
      await expect(hints.locator(`[data-ws-key="${key}"]`)).toBeVisible()
  })

  test('t switches the theme, and the choice is remembered', async ({ page }) => {
    expect(await theme(page)).toBe('dark')
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('.WsStatusLine')).toContainText('rose-pine-dawn')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('the hint is the control: clicking it does what the key does', async ({ page }) => {
    await page.locator('[data-ws-key="t"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('j and k scroll, and the status line says where the page is', async ({ page }) => {
    const position = page.locator('.WsStatusLine .ws-status-line__item--edge').first()
    await expect(position).toHaveText('top')
    await page.keyboard.press('j')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
    await expect(position).toHaveText(/^\d+%$/)
    await page.keyboard.press('k')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(position).toHaveText('top')
  })

  test('/ opens the search, and keys typed there are just letters', async ({ page }) => {
    const mode = page.locator('.ws-status-line__mode')
    await expect(mode).toHaveText('NORMAL')
    await page.keyboard.press('/')
    const search = page.locator('.VPLocalSearchBox input')
    await expect(search).toBeFocused()
    await expect(mode).toHaveText('INSERT')
    await page.keyboard.type('tj2')
    await expect(search).toHaveValue('tj2')
    expect(await theme(page)).toBe('dark')
    expect(page.url()).toContain('/styles/prose')
    await page.keyboard.press('Escape')
    await expect(mode).toHaveText('NORMAL')
  })

  test('a number goes to that tab', async ({ page }) => {
    await page.keyboard.press('2')
    await expect(page).toHaveURL(/\/tokens\/color/)
    await expect(page.locator('.VPNavBarMenuLink.active')).toHaveText('tokens')
    await page.keyboard.press('1')
    await expect(page).toHaveURL(/\/identity\//)
  })

  test('a key with a modifier is left to the browser', async ({ page }) => {
    await page.keyboard.press('Control+t')
    await page.keyboard.press('Alt+t')
    expect(await theme(page)).toBe('dark')
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: PHONE, hasTouch: true })

  test('no key hints are shown, and the tabs stay in the bar', async ({ page }) => {
    await open(page, '/styles/prose')
    await expect(page.locator('.ws-status-line__keys')).toBeHidden()
    await expect(page.locator('.ws-status-line__mode')).toBeVisible()
    await expect(page.locator('.VPNavBarMenuLink')).toHaveCount(4)
    for (const tab of await page.locator('.VPNavBarMenuLink').all()) await expect(tab).toBeVisible()
    await page.locator('.VPNavBarMenuLink', { hasText: 'tokens' }).click()
    await expect(page).toHaveURL(/\/tokens\/color/)
  })
})

test.describe('in a window too narrow for the key hints', () => {
  test.use({ viewport: { width: 900, height: 800 } })

  for (const [path, secondTab] of [
    ['/styles/prose', /\/tokens\/color/],
    ['/examples/terminal.html', /\/examples\/prose\.html/],
  ] as const) {
    test(`a key whose hint is hidden does nothing on ${path}`, async ({ page }) => {
      await open(page, path)
      await expect(page.locator('.ws-status-line__keys')).toBeHidden()
      await page.keyboard.press('t')
      // a tab shows its number at every width, so that key still works: it is handled after t
      await page.keyboard.press('2')
      await expect(page).toHaveURL(secondTab)
      expect(await theme(page)).not.toBe('light')
    })
  }
})

test.describe('on a plain page', () => {
  test('the keys work with nothing but the module', async ({ page }) => {
    await open(page, '/examples/terminal.html')
    await expect(page.locator('.ws-status-line__keys')).toBeVisible()
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('[data-theme-name]')).toHaveText('rose-pine-dawn')
    await page.keyboard.press('2')
    await expect(page).toHaveURL(/\/examples\/prose\.html/)
    // the choice came along to the next page, before its first paint
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })
})
