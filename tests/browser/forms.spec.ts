import { type Locator, type Page, expect, test } from '@playwright/test'
import { wcagContrast } from 'culori'
import { DESKTOP, PHONE, open } from './pages.ts'

/**
 * The pieces forms share: the segmented control, terms and values, number fields, code that
 * wraps, the icons, the hover fill, rows of fields and the phone size of a large ghost. The
 * form example uses all of them the way an app would.
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

/** The email in the review list of the form example. */
const email = (page: Page) =>
  page.locator('.ws-pairs dd', { hasText: 'milica.djordjevic@example.com' })

/** The text of each line an element is drawn on, from the top. */
const drawnLines = (locator: Locator) =>
  locator.evaluate((element) => {
    const lines = new Map<number, string>()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? ''
      for (let index = 0; index < text.length; index++) {
        const range = document.createRange()
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        const top = Math.round(range.getBoundingClientRect().top)
        lines.set(top, (lines.get(top) ?? '') + text[index])
      }
    }
    return [...lines.values()]
  })

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
  // no ring of the brand's color is left inside it
  expect(await style(page, pressed, 'box-shadow')).toBe('none')
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
  const field = page.getByLabel('Tickets', { exact: true })
  expect(await field.evaluate((element) => getComputedStyle(element).appearance)).toBe('textfield')
  await field.focus()
  await page.keyboard.press('ArrowUp')
  await expect(field).toHaveValue('3')
  // a field has the focus: the mode says so
  await expect(page.locator('.ws-status-line__mode')).toHaveText('INSERT')
  // as tall as every other control, --ws-size-control
  expect((await field.boundingBox())!.height).toBe(40)
})

test("a number field's step buttons step it, leave the focus in it and stop at its limits", async ({
  page,
}) => {
  await open(page, FORM)
  const field = page.getByLabel('Tickets', { exact: true })
  const decrease = page.getByRole('button', { name: 'Decrease Tickets' })
  const increase = page.getByRole('button', { name: 'Increase Tickets' })
  // the field is the one stop: the buttons are not in the tab order
  for (const button of [decrease, increase]) await expect(button).toHaveAttribute('tabindex', '-1')
  await field.click()
  await increase.click()
  await expect(field).toHaveValue('3')
  // the click left the focus in the field, so its arrow keys go on stepping it
  await expect(field).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(field).toHaveValue('4')
  // the pointer on a button is on the field: its edge holds the hover
  await increase.hover()
  expect(await field.evaluate((element) => getComputedStyle(element).borderTopColor)).toBe(
    await token(page, '--ws-color-text-secondary'),
  )
  // a button whose step would pass the limit is disabled
  await field.fill('8')
  await expect(increase).toBeDisabled()
  await expect(decrease).toBeEnabled()
  await field.fill('1')
  await expect(decrease).toBeDisabled()
  await expect(increase).toBeEnabled()
})

test('a click on a step button puts the focus in a number field that did not have it', async ({
  page,
}) => {
  await open(page, FORM)
  const field = page.getByLabel('Tickets', { exact: true })
  // with the focus on no field, the arrow keys would scroll the page
  await page.getByRole('button', { name: 'Increase Tickets' }).click()
  await expect(field).toHaveValue('3')
  await expect(field).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(field).toHaveValue('4')
  // with the focus in another field, the arrow keys would move its caret
  await page.getByLabel('Email', { exact: true }).click()
  await page.getByRole('button', { name: 'Decrease Tickets' }).click()
  await expect(field).toHaveValue('3')
  await expect(field).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(field).toHaveValue('2')
})

test('a click on a step button at its limit keeps the focus in the field and the value', async ({
  page,
}) => {
  await open(page, FORM)
  const field = page.getByLabel('Tickets', { exact: true })
  for (const [name, limit, key, next] of [
    ['Increase Tickets', '8', 'ArrowDown', '7'],
    ['Decrease Tickets', '1', 'ArrowUp', '2'],
  ] as const) {
    const button = page.getByRole('button', { name })
    await field.fill(limit)
    await expect(button).toBeDisabled()
    // the pointer presses it as on any button: a disabled one fails Playwright's own check
    await button.click({ force: true })
    await expect(field).toHaveValue(limit)
    await expect(field).toBeFocused()
    await page.keyboard.press(key)
    await expect(field).toHaveValue(next)
  }
  // in forced colors it is drawn in GrayText, as a native disabled button is
  await field.fill('8')
  await page.emulateMedia({ forcedColors: 'active' })
  const [color, gray] = await page
    .getByRole('button', { name: 'Increase Tickets' })
    .evaluate((element) => {
      const probe = document.createElement('span')
      probe.style.cssText = 'forced-color-adjust: none; color: GrayText'
      element.append(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return [getComputedStyle(element).color, value]
    })
  expect(color).toBe(gray)
})

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true })

  test('a tap on a step button leaves the focus where it is, so no keyboard opens', async ({
    page,
  }) => {
    await open(page, FORM)
    const other = page.getByLabel('Email', { exact: true })
    await other.focus()
    await page.getByRole('button', { name: 'Increase Tickets' }).tap()
    await expect(page.getByLabel('Tickets', { exact: true })).toHaveValue('3')
    await expect(other).toBeFocused()
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: PHONE })

  test('a wrapped line of code hangs one level in from its own text', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await open(page, FORM)
    const line = page.locator('.ws-code--wrap .line', { hasText: '"note"' })
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
    expect(await drawnLines(email(page))).toEqual(['milica.djordjevic@example.com'])
    const lefts = await page
      .locator('.ws-pairs:not(.ws-pairs--amounts) dd')
      .evaluateAll((elements) =>
        elements.map((element) => Math.round(element.getBoundingClientRect().left)),
      )
    expect(new Set(lefts).size).toBe(1)
  })

  test('the sections of a review share one term column, as wide as their longest term', async ({
    page,
  }) => {
    await open(page, FORM)
    // the group, found by what it holds, so it is still found once it is no longer one
    const group = page.locator('.summary div:has(> .summary__section)')
    await expect(group).toHaveClass('ws-pairs-group')
    await expect(group.locator('.ws-pairs')).toHaveCount(2)
    const columns = () =>
      group.evaluate((element) => {
        const left = (selector: string) =>
          [...element.querySelectorAll(selector)].map((item) =>
            Math.round(item.getBoundingClientRect().left),
          )
        const terms = [...element.querySelectorAll('dt')].map((term) => {
          // the width of its text, as one line
          const range = document.createRange()
          range.selectNodeContents(term)
          return range.getBoundingClientRect().width
        })
        const column = element.querySelector('dt')!.getBoundingClientRect().width
        return { values: new Set(left('dd')).size, longest: Math.max(...terms), column }
      })
    const shared = await columns()
    expect(shared.values).toBe(1)
    // the longest term, Workshop, is in the second section: the first takes its width too
    expect(shared.column).toBeCloseTo(shared.longest, 0)
    // each list on its own sizes its terms apart, so the sections no longer line up
    await group.evaluate((element) => element.classList.remove('ws-pairs-group'))
    expect((await columns()).values).toBe(2)
  })

  test('without subgrid, as before Chrome 117, a term still stands beside its value', async ({
    page,
  }) => {
    await open(page, FORM)
    // a browser without subgrid ignores the rule that sets it
    const removed = await page.evaluate(() => {
      let count = 0
      for (const sheet of document.styleSheets) {
        const rules = sheet.cssRules
        for (let index = rules.length - 1; index >= 0; index--) {
          const rule = rules[index]
          if (rule instanceof CSSSupportsRule && rule.conditionText.includes('subgrid')) {
            sheet.deleteRule(index)
            count++
          }
        }
      }
      return count
    })
    expect(removed).toBeGreaterThan(0)
    const rows = await page.locator('.ws-pairs > div').evaluateAll((elements) =>
      elements.map((row) => {
        const term = row.querySelector('dt')!.getBoundingClientRect()
        const value = row.querySelector('dd')!.getBoundingClientRect()
        return {
          // the gap the list sets between its columns
          listGap: parseFloat(getComputedStyle(row.parentElement!).columnGap),
          gap: value.left - term.right,
          sameTop: Math.abs(term.top - value.top) < term.height,
        }
      }),
    )
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.sameTop).toBe(true)
      expect(row.listGap).toBeGreaterThan(0)
      expect(row.gap).toBeCloseTo(row.listGap, 0)
    }
  })

  test('an email too long for a narrow phone breaks after its @, not in a word', async ({
    page,
  }) => {
    await open(page, FORM)
    for (let width = 320; width <= 400; width += 8) {
      await page.setViewportSize({ width, height: 900 })
      const lines = await drawnLines(email(page))
      expect(
        [['milica.djordjevic@example.com'], ['milica.djordjevic@', 'example.com']],
        `${width} px`,
      ).toContainEqual(lines)
      if (width === 320) expect(lines, 'too long for 320 px').toHaveLength(2)
    }
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

test('two fields share a row from 40rem, and below it each takes a line', async ({ page }) => {
  await open(page, FORM)
  const fields = page.locator('.form__row .field')
  const tops = () =>
    fields.evaluateAll((elements) => elements.map((field) => field.getBoundingClientRect().top))
  for (const [width, row] of [
    [320, false],
    [639, false],
    [640, true],
    [768, true],
    [DESKTOP.width, true],
  ] as const) {
    await page.setViewportSize({ width, height: 900 })
    const [first, second] = await tops()
    expect(first === second, `${width} px`).toBe(row)
  }
})

test('the guide draws the icons of the grid at the icon size, the calendar among them', async ({
  page,
}) => {
  await open(page, '/styles/forms')
  const drawn = await page.locator('.icons .icon').evaluateAll((elements) =>
    elements.map((icon) => {
      const mark = icon.querySelector('.drawn')!
      const { width, height } = mark.getBoundingClientRect()
      return {
        name: icon.textContent!.trim(),
        width,
        height,
        mask: getComputedStyle(mark).maskImage,
      }
    }),
  )
  // the chevron and the arrow are glyphs, sized with their text, and not drawn at the icon size
  expect(drawn.map(({ name }) => name)).toEqual([
    '--ws-icon-note',
    '--ws-icon-tip',
    '--ws-icon-warning',
    '--ws-icon-danger',
    '--ws-icon-check',
    '--ws-icon-calendar',
  ])
  for (const icon of drawn) {
    expect(icon, icon.name).toMatchObject({ width: 16, height: 16 })
    expect(icon.mask, icon.name).toMatch(/^url\("data:image\/svg\+xml,/)
  }
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
