import { type Page, expect, test } from '@playwright/test'
import { PHONE, open } from './pages.ts'

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme)
const keySwitch = (page: Page) => page.getByRole('switch', { name: 'Shortcut keys' })

/**
 * What the page does to name a key: the key caps of the status line, the numbers of the
 * tabs, the key of the search field, and what a control tells assistive technology.
 */
const named = (page: Page) =>
  page.evaluate(() => {
    const drawn = (selector: string, pseudo: string) => {
      const element = document.querySelector(selector)
      return !!element && getComputedStyle(element, pseudo).content !== 'none'
    }
    const caps = [...document.querySelectorAll('.ws-status-line__keys .ws-kbd')]
    return {
      hints: caps.some((cap) => cap.getClientRects().length > 0),
      numbers: drawn('.VPNavBarMenuLink, .ws-tabs a', '::before'),
      search: drawn('.DocSearch-Button-Keys', '::after'),
      spoken: document.querySelectorAll('[aria-keyshortcuts]').length > 0,
    }
  })
const ALL = { hints: true, numbers: true, search: true, spoken: true }
const NONE = { hints: false, numbers: false, search: false, spoken: false }

/** Presses every key of the theme and says what moved. Nothing does while the keys rest. */
async function pressAll(page: Page) {
  const before = { theme: await theme(page), url: page.url() }
  for (const key of ['t', 'j', '/', '2']) await page.keyboard.press(key)
  // long enough for a scroll, a search box or a new page to show up
  await page.waitForTimeout(300)
  return {
    theme: (await theme(page)) !== before.theme,
    scrolled: (await page.evaluate(() => window.scrollY)) > 0,
    search: (await page.locator('.VPLocalSearchBox').count()) > 0,
    left: page.url() !== before.url,
  }
}
const NOTHING = { theme: false, scrolled: false, search: false, left: false }

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
    await expect(page.locator('.WsStatusLine .ws-status-line__item--dark')).toBeVisible()
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('.WsStatusLine .ws-status-line__item--light')).toBeVisible()
    await expect(page.locator('.WsStatusLine .ws-status-line__item--dark')).toBeHidden()
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

  test('a held key acts once', async ({ page }) => {
    // a key that stays down is sent again and again
    for (let sent = 0; sent < 4; sent++) await page.keyboard.down('t')
    await page.keyboard.up('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    // and once more for the next press
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('the keys act while the search lies over the page and its switch', async ({ page }) => {
    await page.keyboard.press('/')
    await expect(page.locator('.VPLocalSearchBox input')).toBeFocused()
    // on a button of the search box a key is not typed
    await page.locator('.VPLocalSearchBox .toggle-layout-button').focus()
    await expect(page.locator('.ws-status-line__mode')).toHaveText('NORMAL')
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.keyboard.press('2')
    await expect(page).toHaveURL(/\/tokens\/color/)
  })
})

test.describe('the keys switch', () => {
  test.beforeEach(async ({ page }) => {
    await open(page, '/styles/prose')
  })

  test('is a real switch: it has a name, a state and takes focus, and the keys are on', async ({
    page,
  }) => {
    const control = keySwitch(page)
    await expect(control).toBeVisible()
    await expect(control).toHaveJSProperty('tagName', 'BUTTON')
    await expect(control).toHaveAttribute('aria-checked', 'true')
    await expect(control).toHaveText('keys on', { useInnerText: true })
    await control.focus()
    await expect(control).toBeFocused()
    expect(await named(page)).toEqual(ALL)
    await expect(page.locator('[data-ws-key="t"]')).toHaveAttribute('aria-keyshortcuts', 't')
  })

  test('switched off, no key acts and nothing on the page names one', async ({ page }) => {
    await keySwitch(page).click()
    await expect(keySwitch(page)).toHaveAttribute('aria-checked', 'false')
    await expect(keySwitch(page)).toHaveText('keys off', { useInnerText: true })
    expect(await named(page)).toEqual(NONE)
    expect(await pressAll(page)).toEqual(NOTHING)
    // k has nothing to undo, and neither it nor a number does anything else
    await page.keyboard.press('k')
    await page.keyboard.press('1')
    expect(page.url()).toContain('/styles/prose')
  })

  test('switched off, the controls of the status line stay and work by hand', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await keySwitch(page).click()
    const keys = page.locator('.ws-status-line__keys')
    // the two scroll controls are nothing but their keys
    await expect(keys.locator('[data-ws-key="j"]')).toBeHidden()
    await expect(keys.locator('[data-ws-key="k"]')).toBeHidden()
    await expect(keys.locator('[data-ws-key="t"]')).toHaveText('theme', { useInnerText: true })
    await expect(keys.locator('[data-ws-key="/"]')).toHaveText('search', { useInnerText: true })
    await keys.locator('[data-ws-key="t"]').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await keys.locator('[data-ws-key="/"]').click()
    await expect(page.locator('.VPLocalSearchBox input')).toBeFocused()
  })

  test('works from the keyboard, both ways', async ({ page }) => {
    const control = keySwitch(page)
    await control.focus()
    await page.keyboard.press('Space')
    await expect(control).toHaveAttribute('aria-checked', 'false')
    expect(await pressAll(page)).toEqual(NOTHING)
    await expect(control).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(control).toHaveAttribute('aria-checked', 'true')
    expect(await named(page)).toEqual(ALL)
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('is remembered, and off before a key can act on the next page', async ({ page }) => {
    await keySwitch(page).click()
    await page.reload()
    // pressed as soon as the page is there, with no wait for it to settle
    expect(await pressAll(page)).toEqual(NOTHING)
    await expect(keySwitch(page)).toHaveAttribute('aria-checked', 'false')
    expect(await named(page)).toEqual(NONE)
    // and again once it has settled
    expect(await pressAll(page)).toEqual(NOTHING)
    // on again, and that is remembered too
    await keySwitch(page).click()
    await page.reload()
    await expect(keySwitch(page)).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('2')
    await expect(page).toHaveURL(/\/tokens\/color/)
  })

  test('remembered off, a page names no key from its first paint', async ({ page }) => {
    await keySwitch(page).click()
    // the page as it is before the app runs: its scripts never arrive
    await page.route('**/assets/**/*.js', (route) => route.abort())
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-ws-keys', 'off')
    expect(await named(page)).toEqual(NONE)
    // the switch waits for the app, which gives it its state: it never reads "on" here
    await expect(page.locator('.ws-status-line__switch')).toBeHidden()
  })

  test('holds for the pages embedded in this one', async ({ page }) => {
    await open(page, '/styles/terminal')
    const embedded = page.frameLocator('iframe').first()
    const inner = embedded.getByRole('switch', { name: 'Shortcut keys' })
    await expect(inner).toHaveAttribute('aria-checked', 'true')
    await keySwitch(page).click()
    await expect(inner).toHaveAttribute('aria-checked', 'false')
    await keySwitch(page).click()
    await expect(inner).toHaveAttribute('aria-checked', 'true')
  })
})

test.describe('where the browser refuses storage', () => {
  test('the page works with the keys on, and the switch holds for the page', async ({ page }) => {
    await page.addInitScript(() => {
      for (const method of ['getItem', 'setItem', 'removeItem'] as const)
        Storage.prototype[method] = () => {
          throw new DOMException('The operation is insecure.', 'SecurityError')
        }
    })
    await open(page, '/styles/prose')
    await expect(keySwitch(page)).toHaveAttribute('aria-checked', 'true')
    expect(await named(page)).toEqual(ALL)
    await page.keyboard.press('j')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
    await page.keyboard.press('k')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await keySwitch(page).click()
    await expect(keySwitch(page)).toHaveAttribute('aria-checked', 'false')
    expect(await pressAll(page)).toEqual(NOTHING)
  })
})

for (const [name, viewport] of [
  ['on a phone', PHONE],
  ['on the narrowest phone', { width: 320, height: 640 }],
  ['in a window too narrow for the key hints', { width: 900, height: 800 }],
] as const) {
  test.describe(`the keys switch ${name}`, () => {
    test.use({ viewport })

    test('is in reach wherever a number is a key, and turns the numbers off', async ({ page }) => {
      await open(page, '/styles/prose')
      const control = keySwitch(page)
      await expect(control).toBeVisible()
      // all of it is inside the window, where a finger or a pointer gets to it
      const box = (await control.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
      expect(await named(page)).toMatchObject({ hints: false, numbers: true })

      await control.click()
      await expect(control).toHaveAttribute('aria-checked', 'false')
      expect(await named(page)).toMatchObject({ hints: false, numbers: false })
      expect(await pressAll(page)).toEqual(NOTHING)

      await control.click()
      await page.keyboard.press('2')
      await expect(page).toHaveURL(/\/tokens\/color/)
    })
  })
}

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
    await expect(page.locator('.ws-status-line__item--dark')).toBeVisible()
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('.ws-status-line__item--light')).toBeVisible()
    await expect(page.locator('.ws-status-line__item--dark')).toBeHidden()
    await page.keyboard.press('2')
    await expect(page).toHaveURL(/\/examples\/prose\.html/)
    // the choice came along to the next page, before its first paint
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('the switch turns them off, and that comes along to the next page', async ({ page }) => {
    await open(page, '/examples/terminal.html')
    const control = keySwitch(page)
    await expect(control).toHaveAttribute('aria-checked', 'true')
    await control.click()
    await expect(control).toHaveText('keys off', { useInnerText: true })
    expect(await named(page)).toMatchObject({ hints: false, numbers: false, spoken: false })
    expect(await pressAll(page)).toMatchObject({ theme: false, left: false })
    // the theme button stays, without its key, and works by hand
    const button = page.locator('[data-toggle-theme]')
    await expect(button).toHaveText('theme', { useInnerText: true })
    await button.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.locator('.ws-tabs a', { hasText: 'writing' }).click()
    await expect(page).toHaveURL(/\/examples\/prose\.html/)
    await expect(keySwitch(page)).toHaveAttribute('aria-checked', 'false')
    expect(await named(page)).toMatchObject({ hints: false, numbers: false })
    await keySwitch(page).click()
    await page.keyboard.press('1')
    await expect(page).toHaveURL(/\/examples\/terminal\.html/)
  })

  test('the status line names the theme without any script', async ({ browser }) => {
    for (const [colorScheme, shown, hidden] of [
      ['dark', '--dark', '--light'],
      ['light', '--light', '--dark'],
    ] as const) {
      const context = await browser.newContext({ colorScheme, javaScriptEnabled: false })
      const page = await context.newPage()
      await page.goto('/examples/terminal.html')
      await expect(page.locator(`.ws-status-line__item${shown}`), colorScheme).toBeVisible()
      await expect(page.locator(`.ws-status-line__item${hidden}`), colorScheme).toBeHidden()
      // without the module there are no keys, so there is no switch and no hint to show
      await expect(page.locator('.ws-status-line__switch'), colorScheme).toBeHidden()
      await expect(page.locator('.ws-status-line__keys'), colorScheme).toBeHidden()
      await context.close()
    }
  })
})
