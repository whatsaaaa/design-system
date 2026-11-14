import { type Page, expect, test } from '@playwright/test'
import { wcagContrast } from 'culori'
import { DESKTOP, PHONE, open } from './pages.ts'

/**
 * The pieces forms share: the segmented control, terms and values, number fields, code that
 * wraps, the check icon, the hover fill and the phone size of a large ghost. The form example
 * uses all of them the way an app would.
 */
const FORM = '/examples/form.html'

/** The value of a token where an element stands, as the browser computes a color from it. */
const token = (page: Page, name: string, selector = 'body') =>
  page
    .locator(selector)
    .first()
    .evaluate((element, variable) => {
      const probe = document.createElement('span')
      probe.style.color = `var(${variable})`
      element.append(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return value
    }, name)

const style = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property)

for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(colorScheme, () => {
    test.use({ colorScheme })

    // Every width from the narrowest phone up: nothing is cut off by the window or sticks out.
    test('the form fits every width from 320 px, nothing cut off by the window', async ({
      page,
    }) => {
      await open(page, FORM)
      for (let width = 320; width <= 400; width += 8) {
        await page.setViewportSize({ width, height: 900 })
        const measured = await page.evaluate(() => {
          const term = document.querySelector('.ws-term')!
          const outside = [
            ...document.querySelectorAll('.ws-segmented, .ws-pairs dd, .ws-code, .input, .button'),
          ]
            .filter((element) => {
              const box = element.getBoundingClientRect()
              const frame = term.getBoundingClientRect()
              return box.left < frame.left - 0.5 || box.right > frame.right + 0.5
            })
            .map((element) => element.className || element.tagName)
          const pre = document.querySelector('.ws-code--wrap pre')!
          return {
            page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            window: term.scrollWidth - term.clientWidth,
            code: pre.scrollWidth - pre.clientWidth,
            outside,
          }
        })
        expect(measured, `${width} px`).toEqual({ page: 0, window: 0, code: 0, outside: [] })
      }
    })

    test('the pressed segment stands out at 3:1, by its edge', async ({ page }) => {
      await open(page, FORM)
      const pressed = '.ws-segmented [aria-pressed="true"]'
      const interactive = await token(page, '--ws-color-interactive')
      expect(await style(page, pressed, 'border-top-color')).toBe(interactive)
      expect(await style(page, pressed, 'box-shadow')).toContain(interactive)
      // the edge on the page around it and on the segment's own fill
      for (const background of [
        await token(page, '--ws-color-bg'),
        await style(page, pressed, 'background-color'),
      ])
        expect(wcagContrast(interactive, background)).toBeGreaterThanOrEqual(3)
      // a segment that is not pressed has the plain edge of a field
      expect(await style(page, '.ws-segmented [aria-pressed="false"]', 'border-top-color')).toBe(
        await token(page, '--ws-color-field-border'),
      )
    })

    test('the primary button of the docs theme takes the hover and pressed fills', async ({
      page,
    }) => {
      await open(page, '/docs/sample/home')
      const button = page.locator('.VPHome .VPButton.brand').first()
      await button.hover()
      await expect
        .poll(() => button.evaluate((element) => getComputedStyle(element).backgroundColor))
        .toBe(await token(page, '--ws-color-interactive-hover'))
      await page.mouse.down()
      await expect
        .poll(() => button.evaluate((element) => getComputedStyle(element).backgroundColor))
        .toBe(await token(page, '--ws-color-interactive-active'))
      await page.mouse.up()
    })
  })
}

test('a segmented control is pressed with the keyboard, one segment at a time', async ({
  page,
}) => {
  await open(page, FORM)
  const [english, serbian] = [
    page.getByRole('button', { name: 'English' }),
    page.getByRole('button', { name: 'Srpski' }),
  ]
  await expect(page.getByRole('group', { name: 'Language' })).toBeVisible()
  // each segment is a stop of the Tab key
  await english.focus()
  await page.keyboard.press('Tab')
  await expect(serbian).toBeFocused()
  await page.keyboard.press('Space')
  await expect(serbian).toHaveAttribute('aria-pressed', 'true')
  await expect(english).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('Shift+Tab')
  await expect(english).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(english).toHaveAttribute('aria-pressed', 'true')
  await expect(serbian).toHaveAttribute('aria-pressed', 'false')
  // pressing the pressed one again leaves it pressed
  await page.keyboard.press('Enter')
  await expect(english).toHaveAttribute('aria-pressed', 'true')
  // its focus ring is drawn over the segment next to it, not under it
  expect(Number(await style(page, '.ws-segmented :focus-visible', 'z-index'))).toBeGreaterThan(
    Number(await style(page, '.ws-segmented [aria-pressed="false"]', 'z-index')) || 0,
  )
})

test('the pressed segment takes the selection colors in forced colors', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await open(page, FORM)
  const pressed = '.ws-segmented [aria-pressed="true"]'
  const highlight = await page.evaluate(() => {
    const probe = document.createElement('span')
    probe.style.color = 'Highlight'
    document.body.append(probe)
    return getComputedStyle(probe).color
  })
  expect(await style(page, pressed, 'background-color')).toBe(highlight)
  expect(await style(page, '.ws-segmented [aria-pressed="false"]', 'background-color')).not.toBe(
    highlight,
  )
})

test('amounts line up at the right edge in figures of one width, under a total', async ({
  page,
}) => {
  await open(page, FORM)
  const amounts = page.locator('.ws-pairs--amounts dd')
  const rights = await amounts.evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().right)),
  )
  expect(new Set(rights).size).toBe(1)
  expect(await style(page, '.ws-pairs--amounts dd', 'font-variant-numeric')).toBe('tabular-nums')
  // the value shares a baseline with its term
  const [term, value] = await page
    .locator('.ws-pairs--amounts > div')
    .first()
    .evaluate((row) =>
      [...row.children].map((element) => {
        const range = document.createRange()
        range.selectNodeContents(element)
        const text = range.getClientRects()[0]!
        const { fontSize } = getComputedStyle(element)
        return text.bottom - parseFloat(fontSize) * 0.2
      }),
    )
  expect(Math.abs(term! - value!)).toBeLessThan(3)
  expect(await style(page, '.ws-pairs__total dd', 'font-weight')).toBe('600')
  expect(await style(page, '.ws-pairs__total', 'border-top-style')).toBe('solid')
})

test('a number field has no spin buttons, and the arrow keys step it', async ({ page }) => {
  await open(page, FORM)
  const field = page.getByLabel('Tickets')
  expect(await field.evaluate((element) => getComputedStyle(element).appearance)).toBe('textfield')
  await field.focus()
  await page.keyboard.press('ArrowUp')
  await expect(field).toHaveValue('3')
  // a field has the focus: the mode says so
  await expect(page.locator('.ws-status-line__mode')).toHaveText('INSERT')
  // as tall as every other control, --ws-size-control
  expect((await field.boundingBox())!.height).toBe(40)
})

test.describe('on a phone', () => {
  test.use({ viewport: PHONE })

  test('a wrapped line of code hangs one level in from its own text', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await open(page, FORM)
    const line = page.locator('.ws-code--wrap .line').nth(3)
    const { lines, starts, ch } = await line.evaluate((element) => {
      const range = document.createRange()
      range.selectNodeContents(element)
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0)
      const tops = [...new Set(rects.map((rect) => Math.round(rect.top)))]
      const box = element.getBoundingClientRect()
      const probe = document.createElement('span')
      probe.textContent = '0'
      element.append(probe)
      const width = probe.getBoundingClientRect().width
      probe.remove()
      return {
        lines: tops.length,
        // where each visual line starts, in characters from the box's edge
        starts: tops.map((top) =>
          Math.round(
            (Math.min(
              ...rects.filter((rect) => Math.round(rect.top) === top).map((rect) => rect.left),
            ) -
              box.left) /
              width,
          ),
        ),
        ch: width,
      }
    })
    expect(ch).toBeGreaterThan(0)
    expect(lines).toBeGreaterThan(1)
    // the line starts where it is indented, two characters in, and the rest four in
    expect(starts[0]).toBe(0)
    expect(starts.slice(1).every((start) => start === 4)).toBe(true)
  })

  test('a wrapped line stays inside its block without the box sizing of base.css', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await open(page, FORM)
    // a page that takes code.css but not base.css sizes boxes the browser's way
    await page.addStyleTag({ content: '*, ::before, ::after { box-sizing: content-box }' })
    const pre = page.locator('.ws-code--wrap pre')
    expect(await pre.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
  })

  test('a short term leaves its value the rest of the row, and the values line up', async ({
    page,
  }) => {
    await open(page, FORM)
    const lines = await page
      .locator('.ws-pairs dd', { hasText: 'milica.djordjevic@example.com' })
      .evaluate((element) => {
        const range = document.createRange()
        range.selectNodeContents(element)
        return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size
      })
    expect(lines).toBe(1)
    const lefts = await page
      .locator('.ws-pairs:not(.ws-pairs--amounts) dd')
      .evaluateAll((elements) =>
        elements.map((element) => Math.round(element.getBoundingClientRect().left)),
      )
    expect(new Set(lefts).size).toBe(1)
  })

  test('a large ghost takes its compact size, and its full one on a wide screen', async ({
    page,
  }) => {
    await open(page, '/examples/terminal.html')
    const sprite = page.locator('ws-ghost[compact-px] .ws-ghost__sprite')
    expect(await sprite.boundingBox()).toMatchObject({ width: 40, height: 48 })
    await page.setViewportSize(DESKTOP)
    await expect.poll(async () => (await sprite.boundingBox())?.width).toBe(60)
  })
})

test('a done step and a ticked box draw the check icon', async ({ page }) => {
  await open(page, FORM)
  for (const selector of ['.steps__item--done .steps__number', '.choice__input:checked'])
    expect(
      await page
        .locator(selector)
        .evaluate((element) => getComputedStyle(element, '::before').maskImage),
      selector,
    ).toContain('M3 8.5 6.5 12 13 4.5')
})

test('the ghost files show the ghost of the theme, without innerHTML', async ({ page }) => {
  await open(page, FORM)
  const shown = page.locator('.ghost-link img:visible')
  await expect(shown).toHaveCount(1)
  await expect(shown).toHaveAttribute('src', /ghost-on-dark\.svg$/)
  expect(await shown.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(20)
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
  await expect(shown).toHaveAttribute('src', /ghost-on-light\.svg$/)
})
