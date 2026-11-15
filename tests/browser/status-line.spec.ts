import { type Page, expect, test } from '@playwright/test'
import { DESKTOP, NARROWEST, PHONE, open } from './pages.ts'

/** A path too long for any of the widths swept here, so it always has to give way. */
const LONG_PATH = '~/projects/form-builder/docs/guide/conditions.md'

/**
 * How far the status line's items reach past its right edge, and how its path shows: hidden,
 * cut, or whole. `room` is the width the path has, `least` the width of "~…" in the path's
 * face, and `padding` the padding the path has on its two sides together.
 */
const measure = () => {
  const line = document.querySelector('.ws-status-line')!
  const edge = line.getBoundingClientRect().right
  const items = [...line.children].filter((item) => item.getClientRects().length > 0)
  const overflow = Math.max(...items.map((item) => item.getBoundingClientRect().right)) - edge
  const file = line.querySelector<HTMLElement>('.ws-status-line__file')!
  const text = file.querySelector('span')!
  const probe = document.createElement('span')
  probe.textContent = '~…'
  probe.style.cssText = `position: absolute; visibility: hidden; font: ${getComputedStyle(text).font}`
  document.body.append(probe)
  const least = probe.getBoundingClientRect().width
  probe.remove()
  const style = getComputedStyle(file)
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  const room = line.querySelector('.ws-status-line__path')!.getBoundingClientRect().width
  const shown = { overflow, room, least, padding }
  if (file.getClientRects().length === 0) return { ...shown, path: 'hidden' as const }
  return {
    ...shown,
    path: text.scrollWidth > text.clientWidth ? ('cut' as const) : ('whole' as const),
    // the width of what the text shows, and of what is around it
    text: text.getBoundingClientRect().width,
    around: file.getBoundingClientRect().width - text.getBoundingClientRect().width,
  }
}

async function sweep(page: Page, widths: number[]) {
  const seen = new Set<string>()
  for (const width of widths) {
    await page.setViewportSize({ width, height: 640 })
    const at = `${width} px`
    const shown = await page.evaluate(measure)
    // the items after the path always fit
    expect(shown.overflow, at).toBeLessThanOrEqual(0)
    if (shown.path === 'hidden') {
      // it goes only when "~…" and the padding no longer fit
      expect(shown.room, at).toBeLessThan(shown.least + shown.padding)
    } else {
      // never a part of a character: at least "~…", between the whole padding
      expect(shown.text, at).toBeGreaterThanOrEqual(shown.least - 0.5)
      expect(shown.around, at).toBeCloseTo(shown.padding, 1)
    }
    seen.add(shown.path)
  }
  return seen
}

for (const colorScheme of ['dark', 'light'] as const) {
  for (const keys of ['on', 'off'] as const) {
    test.describe(`the path of the status line, ${colorScheme}, keys ${keys}`, () => {
      test.use({ colorScheme })

      test.beforeEach(async ({ page }) => {
        if (keys === 'off') await page.addInitScript(() => localStorage.setItem('ws-keys', 'off'))
        await page.setViewportSize(NARROWEST)
        await open(page, '/examples/terminal.html')
        await expect(page.getByRole('switch', { name: 'Shortcut keys' })).toHaveAttribute(
          'aria-checked',
          String(keys === 'on'),
        )
      })

      test('gives way at every width from 320 px, and never shows a part of a character', async ({
        page,
      }) => {
        await page
          .locator('.ws-status-line__file > span')
          .evaluate((text, path) => (text.textContent = path), LONG_PATH)
        const widths = Array.from({ length: 161 }, (_, step) => 320 + step)
        const seen = await sweep(page, [...widths, 768, 1023, 1024, 1280, DESKTOP.width])
        expect(seen.has('cut')).toBe(true)
      })

      test('shows a short path whole wherever it fits', async ({ page }) => {
        const seen = await sweep(page, [320, 360, PHONE.width, 768, DESKTOP.width])
        expect(seen.has('whole')).toBe(true)
      })
    })
  }
}

test.describe('the theme button', () => {
  const themeButton = (page: Page) => page.locator('.ws-status-line__theme')

  for (const [name, viewport] of [
    ['on the narrowest phone', NARROWEST],
    ['on a phone', PHONE],
    ['on a wide screen', DESKTOP],
  ] as const) {
    test(`switches the theme ${name}, and keeps the focus`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await open(page, '/examples/terminal.html')
      const button = themeButton(page)
      // its name is what it does and the name of the theme shown
      await expect(button).toHaveAccessibleName('Switch theme, now rose-pine')
      await expect(button.locator('.ws-theme-dark')).toBeVisible()
      await expect(button.locator('.ws-theme-light')).toBeHidden()
      // all of it is inside the window, where a finger or a pointer gets to it
      const box = (await button.boundingBox())!
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)

      await button.focus()
      await page.keyboard.press('Enter')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await expect(button).toBeFocused()
      await expect(button).toHaveAccessibleName('Switch theme, now rose-pine-dawn')
      await expect(button.locator('.ws-theme-light')).toBeVisible()
      await expect(button.locator('.ws-theme-dark')).toBeHidden()
      await page.keyboard.press('Space')
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      await expect(button).toBeFocused()
    })
  }

  test('works with the keys off, and a tap switches it', async ({ page }) => {
    await page.setViewportSize(PHONE)
    await open(page, '/examples/terminal.html')
    await page.getByRole('switch', { name: 'Shortcut keys' }).click()
    await themeButton(page).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    // the choice comes along to the next page
    await page.locator('.ws-tabs a', { hasText: 'writing' }).click()
    await expect(page).toHaveURL(/\/examples\/prose\.html/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(themeButton(page)).toHaveAccessibleName('Switch theme, now rose-pine-dawn')
  })
})
