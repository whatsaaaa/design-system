import { type Page, expect, test } from '@playwright/test'
import {
  type Failure,
  type SpecOptions,
  checkSpec,
  expectSpec,
  loadSpec,
  specNames,
} from '@whatsaaaa/design-system/testing'
import { ORIGIN, gallery } from './spec-gallery.ts'

/**
 * The parity helper, as an implementation runs it: the built entry, against a gallery of plain
 * HTML that meets the published specs, and against the same gallery with one thing wrong.
 */
/**
 * The fixture's own map of parts, passed to the helper as an implementation passes its own: it
 * draws every part in the slot of the part's name, but for those a pseudo-element draws.
 */
const pseudoParts: Record<string, Record<string, string>> = {
  checkbox: { required: 'label::after' },
  input: { placeholder: 'root::placeholder', required: 'label::after' },
  'number-field': { placeholder: 'root::placeholder', required: 'label::after' },
  'radio-group': { required: 'legend::after' },
  select: { 'item-highlight': 'item::before' },
  'select-menu': { 'item-highlight': 'item::before' },
  table: { 'loading-bar': 'thead::after' },
  textarea: { placeholder: 'root::placeholder', required: 'label::after' },
}
const fixture = (name: string): SpecOptions => ({ parts: pseudoParts[name] ?? {} })

/** What failed, without the message: the check, the theme and the example. */
const where = (failures: Failure[]) =>
  failures.map(({ check, theme, id }) => [check, theme ?? '*', id ?? '*'])

let page: Page
test.beforeEach(async ({ browser }) => {
  ;({ page } = await gallery(browser))
})
test.afterEach(() => page.context().close())

test('the specs it checks are the published ones', () => {
  expect(specNames()).toEqual([
    'badge',
    'button',
    'card',
    'checkbox',
    'input',
    'modal',
    'number-field',
    'radio-group',
    'select',
    'select-menu',
    'table',
    'tabs',
    'textarea',
  ])
  expect(loadSpec('button').component).toBe('button')
  expect(() => loadSpec('../package')).toThrow(/no spec named/)
})

/** How many values each spec's gallery has compared at least, in both themes. */
const leastChecks: Record<string, number> = {
  badge: 400,
  button: 800,
  card: 60,
  checkbox: 300,
  input: 300,
  modal: 50,
  'number-field': 850,
  'radio-group': 300,
  select: 1100,
  'select-menu': 1100,
  table: 350,
  tabs: 200,
  textarea: 500,
}

for (const name of specNames()) {
  test(`a gallery that meets the ${name} spec passes it in both themes`, async () => {
    const { failures, checks } = await checkSpec(page, name, fixture(name))
    expect(failures).toEqual([])
    // every row a gallery example holds for is measured in each theme, so a gallery that draws
    // less fails
    expect(checks).toBeGreaterThan(leastChecks[name]!)
  })
}

test("the system's tag meets the badge spec as its primary and outline kinds at md", async () => {
  await page.goto(`${ORIGIN}/tags.html`)
  const { failures, checks } = await checkSpec(page, 'badge')
  // the page has only the two kinds .ws-tag draws, so the other examples are missing, and with
  // them the rows only they draw, such as an icon's: that is all that fails
  expect(failures.filter(({ check }) => check !== 'coverage')).toEqual([])
  const shown = ['badge.primary.rest', 'badge.outline.rest']
  expect(failures.filter(({ id }) => id && shown.includes(id))).toEqual([])
  expect(checks).toBeGreaterThan(90)
})

test('a gallery on a screen of two device pixels to a CSS pixel passes', async ({ browser }) => {
  // the images of the forced-colors check in device pixels would be cut to their top-left quarter,
  // without the bar along the current tab's foot
  const { context, page } = await gallery(browser, { deviceScaleFactor: 2 })
  for (const name of ['table', 'tabs']) await expectSpec(page, name, fixture(name))
  await context.close()
})

test('it reads the parts an implementation draws under another name from its map', async () => {
  // the button's parts drawn in a library's slots: root is base, an icon leadingIcon
  const parts = { root: 'base', 'leading-icon': 'leadingIcon', 'trailing-icon': 'trailingIcon' }
  await page.evaluate((slots: Record<string, string>) => {
    for (const element of document.querySelectorAll<HTMLElement>('[data-spec^="button."] *'))
      element.dataset.slot = slots[element.dataset.slot!] ?? element.dataset.slot
  }, parts)
  // the map does not name the label: a part it does not name stays the slot of its own name
  await expectSpec(page, loadSpec('button'), { parts })
  // without the map, the parts under another name are not found
  const { failures } = await checkSpec(page, 'button')
  expect(failures.length).toBeGreaterThan(0)
  expect(failures.every(({ check }) => check === 'coverage')).toBe(true)
})

test('a map that names a part the spec does not have is an error that names it', async () => {
  // a part an update of the spec renamed, or a slip of the hand: nothing is checked
  await expect(checkSpec(page, 'button', { parts: { rooot: 'base' } })).rejects.toThrow(
    'the button spec has no part rooot. Its parts are: root, label, leading-icon, trailing-icon',
  )
  await expect(
    expectSpec(page, loadSpec('input'), { parts: { root: 'base', hint: 'hint', lable: 'label' } }),
  ).rejects.toThrow(/^the input spec has no parts hint, lable\. Its parts are: root, /)
})

test('an option it does not have is an error, as the implementation it once took', async () => {
  const options = { implementation: 'ui-vue' } as SpecOptions
  await expect(checkSpec(page, 'button', options)).rejects.toThrow(
    'the parity helper has no option implementation: its one option is parts, ' +
      "the implementation's own map of the parts it draws under another name",
  )
  await expect(expectSpec(page, 'button', options)).rejects.toThrow(/has no option implementation/)
})

test('a map that draws a part as something other than slots and a pseudo-element is an error', async () => {
  for (const as of ['.button', 'base > leadingIcon', 'label:after', 'base::', ''])
    await expect(checkSpec(page, 'button', { parts: { root: as } }), as).rejects.toThrow(
      `the part root of the button spec cannot be drawn as "${as}"`,
    )
})

/**
 * A map as an implementation on a component library writes it, where one slot draws two parts:
 * the trigger is `base` and its icons `leadingIcon` and `trailingIcon`, as is the icon of the
 * search in the list, and a group's name is `label`, as is the form field's label around it. So
 * a part is named by the slot it is inside too.
 */
const selectMenuParts = {
  root: 'base',
  placeholder: 'base placeholder',
  'leading-icon': 'base leadingIcon',
  'trailing-icon': 'base trailingIcon',
  'group-label': 'content label',
  'item-highlight': 'item::before',
  'item-indicator': 'itemTrailingIcon',
  search: 'input',
  'search-icon': 'input leadingIcon',
}

/** The select menu's gallery drawn in the slots of that map. */
async function selectMenuInLibrarySlots(page: Page) {
  await page.evaluate(() => {
    const slots: Record<string, string> = {
      root: 'base',
      'leading-icon': 'leadingIcon',
      'trailing-icon': 'trailingIcon',
      'group-label': 'label',
      'item-indicator': 'itemTrailingIcon',
      search: 'input',
      'search-icon': 'leadingIcon',
    }
    for (const element of document.querySelectorAll<HTMLElement>(
      '[data-spec^="select-menu."] [data-slot]',
    ))
      element.dataset.slot = slots[element.dataset.slot!] ?? element.dataset.slot
  })
}

test('it reads a part in a slot inside another, where one slot draws two parts', async () => {
  await selectMenuInLibrarySlots(page)
  // `base leadingIcon` is the trigger's icon, never the search's in the open list
  await expectSpec(page, 'select-menu', { parts: selectMenuParts })
})

test('a slot that two parts share fails where the example wraps both', async () => {
  await selectMenuInLibrarySlots(page)
  // the example's id around the form field too, and a part map of bare slots: the field's label
  // is the first `label`, and the search's icon the first `leadingIcon` of a trigger without one
  await page.evaluate(() => {
    for (const control of document.querySelectorAll<HTMLElement>(
      '[data-spec^="select-menu.outline.open"]',
    )) {
      control.parentElement!.dataset.spec = control.dataset.spec
      delete control.dataset.spec
    }
  })
  const parts = Object.fromEntries(
    Object.entries(selectMenuParts).map(([part, slot]) => [part, slot.split(' ').at(-1)!]),
  )
  const { failures } = await checkSpec(page, 'select-menu', { parts })
  const messages = failures.map(({ message }) => message)
  expect(messages).toContainEqual(
    expect.stringMatching(
      /^select-menu\.outline\.open: group-label font-size is \d+px, and text\.overline/,
    ),
  )
  expect(messages).toContainEqual(
    expect.stringMatching(
      /^select-menu\.outline\.open: root padding-inline-start is 12px, and the spec says calc/,
    ),
  )
  expect(new Set(failures.map(({ check }) => check))).toEqual(new Set(['tokens']))
})

test('a value that drifts from its token fails, in each theme', async () => {
  // the hover of the primary button left at its rest fill
  await page.addStyleTag({
    content: `[data-spec='button.primary.hover'] .button {
      background-color: var(--ws-button-primary-bg-rest) !important;
    }`,
  })
  const { failures } = await checkSpec(page, 'button')
  expect(where(failures)).toEqual([
    ['tokens', 'dark', 'button.primary.hover'],
    ['tokens', 'light', 'button.primary.hover'],
  ])
  expect(failures[0]!.message).toMatch(
    /^button\.primary\.hover: root background-color is rgb\(.+\), and button\.primary\.bg\.hover \(--ws-button-primary-bg-hover\) is rgb\(.+\)$/,
  )
})

test('a token is resolved where the part is, in a part of the page held in the other theme', async () => {
  // a field held in the light theme, drawn with the dark theme's edge: the page's own value
  const dark = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ws-field-border-rest'),
  )
  await page.addStyleTag({
    content: `[data-spec='input.outline.rest.xl']:has([data-slot='leading-icon']) input {
      border-color: ${dark};
    }`,
  })
  const { failures } = await checkSpec(page, 'input', fixture('input'))
  // in the light theme the edge is wrong wherever the token is resolved, in the dark one only
  // where the part is
  expect(where(failures)).toEqual([
    ['tokens', 'dark', 'input.outline.rest.xl'],
    ['tokens', 'light', 'input.outline.rest.xl'],
  ])
  expect(failures[0]!.message).toContain('root border-color')
})

test('a missing example fails, or one under an id the gallery does not have', async () => {
  await page.evaluate(() => {
    for (const field of document.querySelectorAll('[data-spec="input.outline.invalid"]'))
      field.remove()
    document
      .querySelector('[data-spec="input.outline.hover"]')!
      .setAttribute('data-spec', 'input.outline.hovered')
  })
  const { failures } = await checkSpec(page, 'input', fixture('input'))
  expect(failures).toEqual(
    ['input.outline.hover', 'input.outline.invalid'].map((id) => ({
      check: 'coverage',
      id,
      message: `${id} has no example: no element has data-spec="${id}"`,
    })),
  )
})

test('a part that no example draws fails', async () => {
  // the help of the small fields: its size is never shown
  await page.evaluate(() => {
    for (const help of document.querySelectorAll(
      '[data-spec="input.outline.rest.sm"] [data-slot="help"]',
    ))
      help.remove()
  })
  const { failures } = await checkSpec(page, 'input', fixture('input'))
  expect(failures.map(({ theme, message }) => `${theme}: ${message}`)).toEqual(
    ['dark', 'light'].map(
      (theme) =>
        `${theme}: no example draws help where the row "* rest help font-size at sm" holds: ` +
        `input.outline.rest.sm, input.outline.invalid.sm`,
    ),
  )
})

test('a row with a condition is held only where the example meets it', async () => {
  // the value of the loading field left at the padding, under its leading icon
  await page.addStyleTag({
    content: `[data-spec='input.outline.loading'] input {
      padding-inline-start: var(--ws-space-12) !important;
    }`,
  })
  const { failures } = await checkSpec(page, 'input', fixture('input'))
  expect(where(failures)).toEqual([
    ['tokens', 'dark', 'input.outline.loading'],
    ['tokens', 'light', 'input.outline.loading'],
  ])
  expect(failures[0]!.message).toBe(
    'input.outline.loading: root padding-inline-start is 12px, and the spec says ' +
      'calc(var(--ws-space-12) + var(--ws-control-icon-size-md) + var(--ws-control-gap-md)) (36px)',
  )
})

test('a field whose value moves when its edge widens fails', async () => {
  // the padding at rest kept in an error, so the value moves inward by the wider edge
  await page.addStyleTag({
    content: `[data-spec^='input.outline.invalid'] input { --field-edge-extra: 0px !important; }`,
  })
  const { failures } = await checkSpec(page, 'input', fixture('input'))
  const invalid = ['', '.xs', '.sm', '.lg', '.xl'].map((size) => `input.outline.invalid${size}`)
  expect(new Set(where(failures).map((each) => each.join(' ')))).toEqual(
    new Set(['dark', 'light'].flatMap((theme) => invalid.map((id) => `tokens ${theme} ${id}`))),
  )
  // each side of each field with an error, with its icon and without it
  expect(failures).toHaveLength(2 * invalid.length * 4)
  expect(failures.map(({ message }) => message)).toContain(
    'input.outline.invalid: root padding-inline-start is 12px, and the spec says ' +
      'calc(var(--ws-space-12) - (var(--ws-control-border-width-invalid) - ' +
      'var(--ws-control-border-width-rest))) (11px)',
  )
})

test('a text area whose text moves down when its edge widens fails', async () => {
  // the padding above and below at rest kept in an error, so the text moves inward by the edge
  await page.addStyleTag({
    content: `[data-spec^='textarea.outline.invalid'] textarea {
      padding-block: calc(var(--field-padding-block) - var(--ws-control-border-width-rest)) !important;
    }`,
  })
  const { failures } = await checkSpec(page, 'textarea', fixture('textarea'))
  const invalid = ['', '.xs', '.sm', '.lg', '.xl'].map((size) => `textarea.outline.invalid${size}`)
  expect(new Set(where(failures).map((each) => each.join(' ')))).toEqual(
    new Set(['dark', 'light'].flatMap((theme) => invalid.map((id) => `tokens ${theme} ${id}`))),
  )
  expect(failures.map(({ message }) => message)).toContain(
    'textarea.outline.invalid: root padding-block is 5px, and the spec says ' +
      'calc(var(--ws-space-6) - var(--ws-control-border-width-invalid)) (4px)',
  )
})

test("a number field whose step buttons draw their icons at a library's own size fails", async () => {
  // the icons of the step buttons at 20px, where the field's are 16px up to md
  await page.addStyleTag({
    content: `[data-spec^='number-field.'] .field__step svg { width: 20px; height: 20px; }`,
  })
  const { failures } = await checkSpec(page, 'number-field', fixture('number-field'))
  // the large and extra large fields draw 20px icons, so only the others fail
  const failed = new Set(failures.map(({ id }) => id))
  expect(failed).toContain('number-field.outline.rest')
  expect(failed).toContain('number-field.outline.rest.xs')
  expect(failed).not.toContain('number-field.outline.rest.lg')
  expect(failed).not.toContain('number-field.outline.rest.xl')
  expect(new Set(failures.map(({ check }) => check))).toEqual(new Set(['tokens']))
  expect(failures.map(({ message }) => message)).toContain(
    'number-field.outline.rest: increment-icon width is 20px, and control.icon-size.md ' +
      '(--ws-control-icon-size-md) is 16px',
  )
})

test('a row with a condition that no example meets fails', async () => {
  // a leading icon in the large field with an error that had none, so no large field with an
  // error is without one
  await page.evaluate(() => {
    const control = document.querySelector(
      '[data-spec="input.outline.invalid.lg"] .field__control',
    )!
    control.prepend(
      document
        .querySelector('[data-spec="input.outline.rest.lg"] [data-slot="leading-icon"]')!
        .cloneNode(true),
    )
  })
  const { failures } = await checkSpec(page, 'input', fixture('input'))
  expect(failures.map(({ theme, message }) => `${theme}: ${message}`)).toEqual(
    ['dark', 'light'].map(
      (theme) =>
        `${theme}: no example draws root without leading-icon where the row ` +
        `"* invalid root padding-inline-start at lg without leading-icon" holds: ` +
        `input.outline.invalid.lg`,
    ),
  )
})

test('a list whose edge is a ring, not a border, fails, and loses it in forced colors', async () => {
  // the list drawn as Nuxt UI draws it: an inset ring, a box shadow, in place of its border
  await page.addStyleTag({
    content: `[data-spec^='select.'] .select__content {
      border: 0;
      box-shadow: inset 0 0 0 var(--ws-overlay-border-width) var(--ws-overlay-border-rest);
    }`,
  })
  const { failures } = await checkSpec(page, 'select', fixture('select'))
  const open = ['', '.xs', '.sm', '.lg', '.xl'].map((size) => `select.outline.open${size}`)
  expect(new Set(where(failures).map((each) => each.join(' ')))).toEqual(
    new Set(
      ['dark', 'light'].flatMap((theme) =>
        open.flatMap((id) => ['tokens', 'forced-colors'].map((check) => `${check} ${theme} ${id}`)),
      ),
    ),
  )
  const messages = failures.map(({ message }) => message)
  expect(messages).toContain(
    'select.outline.open: content box-shadow is ' +
      (await page.evaluate(
        () => getComputedStyle(document.querySelector('.select__content')!).boxShadow,
      )) +
      ', and the spec says none (none)',
  )
  expect(
    messages.some((message) => message.startsWith('select.outline.open: content border-color')),
  ).toBe(true)
  expect(messages).toContainEqual(
    expect.stringMatching(/^select\.outline\.open: content loses its border/),
  )
})

test('an outlined badge drawn as a ring, in the padding of a tint, fails', async () => {
  // the outlined badge as ui-vue draws it today: an inset ring, a box shadow, in place of its
  // border, inside the padding of a badge on a tint
  await page.addStyleTag({
    content: `.badge[data-variant='outline'] {
      padding: var(--badge-padding-block) var(--badge-padding-inline);
      border: 0;
      box-shadow: inset 0 0 0 var(--ws-border-width-thin) var(--ws-color-border);
    }`,
  })
  const { failures } = await checkSpec(page, 'badge', fixture('badge'))
  const outlined = ['', '.xs', '.sm', '.lg', '.xl'].map((size) => `badge.outline.rest${size}`)
  expect(new Set(where(failures).map((each) => each.join(' ')))).toEqual(
    new Set(
      ['dark', 'light'].flatMap((theme) =>
        outlined.flatMap((id) =>
          ['tokens', 'forced-colors'].map((check) => `${check} ${theme} ${id}`),
        ),
      ),
    ),
  )
  const messages = failures.map(({ message }) => message)
  expect(messages).toContainEqual(
    expect.stringMatching(/^badge\.outline\.rest: root padding-inline is 8px, and tag\.outline/),
  )
  expect(messages).toContainEqual(
    expect.stringMatching(/^badge\.outline\.rest: root loses its border/),
  )
})

test('a part that loses its edge in forced colors fails', async () => {
  await page.addStyleTag({
    content: `@media (forced-colors: active) {
      .button[data-variant='secondary'] { border-style: none; }
    }`,
  })
  const { failures } = await checkSpec(page, 'button')
  // the focused one keeps its outline, which is its edge then
  expect(where(failures)).toEqual(
    ['dark', 'light'].flatMap((theme) =>
      ['rest', 'hover', 'active', 'disabled', 'loading'].map((state) => [
        'forced-colors',
        theme,
        `button.secondary.${state}`,
      ]),
    ),
  )
  expect(failures[0]!.message).toMatch(/^button\.secondary\.rest: root loses its border/)
})

/** Each part the specs give a line on one side, as `border-block-end`, by its spec. */
const oneSided: [string, string][] = [
  ['card', 'header'],
  ['card', 'body'],
  ['modal', 'header'],
  ['select', 'separator'],
  ['select-menu', 'search'],
  ['select-menu', 'separator'],
  ['table', 'th'],
  ['table', 'tr'],
  ['tabs', 'list'],
]

for (const [name, part] of oneSided)
  test(`a ${name}'s ${part} that loses its line on one side in forced colors fails`, async () => {
    // the line kept everywhere but in forced colors, where it is gone
    await page.addStyleTag({
      content: `@media (forced-colors: active) {
        [data-spec^='${name}.'] [data-slot='${part}'] { border-block-end-style: none !important; }
      }`,
    })
    const { failures } = await checkSpec(page, name, fixture(name))
    expect(failures.length).toBeGreaterThan(0)
    expect(new Set(failures.map(({ check }) => check))).toEqual(new Set(['forced-colors']))
    expect(new Set(failures.map(({ theme }) => theme))).toEqual(new Set(['dark', 'light']))
    for (const { id, message } of failures)
      expect(message).toMatch(
        new RegExp(
          `^${id!.replaceAll('.', '\\.')}: ${part} loses its border-block-end in forced colors: ` +
            'border-block-end 0px none ',
        ),
      )
  })

for (const name of ['select', 'select-menu'])
  test(`a separator of a ${name}'s list drawn as a fill, which forced colors paint in the list's color, fails`, async () => {
    // the line as a fill of the edge's color, in place of the spec's border, which forced colors
    // keep in the system's color for text
    await page.addStyleTag({
      content: `.select__separator {
        border: none;
        height: var(--ws-border-width-thin);
        background-color: var(--ws-color-border);
      }`,
    })
    const { failures } = await checkSpec(page, name, fixture(name))
    const open = ['', '.xs', '.sm', '.lg', '.xl'].map((size) => `${name}.outline.open${size}`)
    expect(new Set(where(failures).map((each) => each.join(' ')))).toEqual(
      new Set(
        ['dark', 'light'].flatMap((theme) =>
          open.flatMap((id) =>
            ['tokens', 'forced-colors'].map((check) => `${check} ${theme} ${id}`),
          ),
        ),
      ),
    )
    expect(failures.map(({ message }) => message)).toContainEqual(
      expect.stringMatching(
        new RegExp(
          `^${name}\\.outline\\.open: separator loses its border-block-end in forced colors: ` +
            'border-block-end 0px none ',
        ),
      ),
    )
  })

test('a part is measured where the example draws it, in the option that is checked', async () => {
  // the checked option of a disabled group, its second, in the fill of an enabled one
  await page.addStyleTag({
    content: `[data-spec='radio-group.list.disabled'] input:checked + [data-slot='indicator'] {
      background-color: var(--ws-choice-indicator-bg-checked) !important;
    }`,
  })
  const { failures } = await checkSpec(page, 'radio-group', fixture('radio-group'))
  expect(where(failures)).toEqual([
    ['tokens', 'dark', 'radio-group.list.disabled'],
    ['tokens', 'light', 'radio-group.list.disabled'],
  ])
  expect(failures[0]!.message).toMatch(
    /^radio-group\.list\.disabled: indicator background-color is rgb\(.+\), and choice\.indicator\.bg\.disabled/,
  )
})

test('a checked box that loses its fill and its mark in forced colors fails', async () => {
  // the fill and the tick still drawn, but nothing of them shows, as when forced colors paint
  // the fill as the page and a tick drawn as a mask over a background goes with it
  await page.addStyleTag({
    content: `@media (forced-colors: active) {
      .choice [data-slot='indicator'] { opacity: 0; }
    }`,
  })
  const { failures } = await checkSpec(page, 'checkbox', fixture('checkbox'))
  // the fill and the mark are drawn only once it is checked, so the examples are compared whole
  const marked = [
    'checked',
    'indeterminate',
    ...['xs', 'sm', 'lg', 'xl'].map((size) => `checked.${size}`),
  ]
  expect(new Set(where(failures).map((each) => each.join(' ')))).toEqual(
    new Set(
      ['dark', 'light'].flatMap((theme) =>
        marked.map((state) => `forced-colors ${theme} checkbox.list.${state}`),
      ),
    ),
  )
  expect(failures[0]!.message).toBe(
    'checkbox.list.checked looks the same as checkbox.list.rest in forced colors: indicator, icon',
  )
})

test('a selected row that looks the same as the one at rest in forced colors fails', async () => {
  // the selected table half a pixel off the one at rest, so its text is drawn at another fraction
  // of a pixel and its image is cut a pixel apart: it still passes
  await page.addStyleTag({
    content: `[data-spec='table.selectable.selected'] { margin-inline-start: 0.5px; }`,
  })
  await expectSpec(page, 'table', fixture('table'))

  // the chosen row drawn as ui-vue draws it: its fill only, with no checkbox, which forced colors
  // paint in the page's color, as they paint every row
  await page.addStyleTag({
    content: `.table .table__check input { visibility: hidden; }
    @media (forced-colors: active) {
      .table tbody tr:has(input:checked) {
        forced-color-adjust: auto !important;
        background-color: var(--ws-table-row-bg-selected) !important;
      }
      .table tbody tr:has(input:checked) td { color: var(--ws-table-row-text-rest) !important; }
    }`,
  })
  const { failures } = await checkSpec(page, 'table', fixture('table'))
  expect(where(failures)).toEqual([
    ['forced-colors', 'dark', 'table.selectable.selected'],
    ['forced-colors', 'light', 'table.selectable.selected'],
  ])
  expect(failures[0]!.message).toBe(
    'table.selectable.selected looks the same as table.selectable.rest in forced colors: tr',
  )
})

test('an error icon that keeps the color of an error in forced colors fails', async () => {
  // the icon in the error's color, as the gallery once drew it: an SVG given a color keeps it in
  // forced colors, where the spec says it takes the system's text color
  await page.addStyleTag({
    content: `@media (forced-colors: active) {
      :is(.field, .choice) [data-slot='error-icon'] { color: var(--ws-field-error-icon-rest); }
    }`,
  })
  const { failures } = await checkSpec(page, 'input', fixture('input'))
  const invalid = ['', '.xs', '.sm', '.lg', '.xl'].map((size) => `input.outline.invalid${size}`)
  expect(new Set(where(failures).map((each) => each.join(' ')))).toEqual(
    new Set(
      ['dark', 'light'].flatMap((theme) => invalid.map((id) => `forced-colors ${theme} ${id}`)),
    ),
  )
  expect(failures[0]!.message).toMatch(
    /^input\.outline\.invalid: error-icon keeps rgb\(\d+, \d+, \d+\) in forced colors, where an icon takes a system color$/,
  )
})

test("a step button's icon whose shapes are given a color of their own in forced colors fails", async () => {
  // the button in the system's color, but the strokes of its icon in the brand's
  await page.addStyleTag({
    content: `@media (forced-colors: active) {
      [data-spec='number-field.outline.rest'] .field__step path { stroke: var(--ws-color-brand); }
    }`,
  })
  const { failures } = await checkSpec(page, 'number-field', fixture('number-field'))
  expect(where(failures)).toEqual(
    ['dark', 'light'].flatMap((theme) =>
      ['decrement-icon', 'increment-icon'].map(() => [
        'forced-colors',
        theme,
        'number-field.outline.rest',
      ]),
    ),
  )
  expect(failures.map(({ message }) => message.split(' keeps ')[0])).toEqual(
    ['dark', 'light'].flatMap(() =>
      ['decrement-icon', 'increment-icon'].map((part) => `number-field.outline.rest: ${part}`),
    ),
  )
})

test('an icon whose spec gives it no color in forced colors may keep its own there', async () => {
  // the checkbox, radio group and tabs specs say nothing of the color of an error icon or a tab's
  // icon in forced colors, so one in a color of the page's is no difference from them
  const icons = ".choice [data-slot='error-icon'], .tabs [data-slot='leading-icon']"
  await page.addStyleTag({
    content: `@media (forced-colors: active) { ${icons} { color: rgb(200, 30, 90); } }`,
  })
  for (const name of ['checkbox', 'radio-group', 'tabs'])
    expect((await checkSpec(page, name, fixture(name))).failures, name).toEqual([])
  await page.emulateMedia({ forcedColors: 'active' })
  const strokes = await page.evaluate(
    (icons) =>
      [...document.querySelectorAll(icons)].flatMap((icon) =>
        [...icon.querySelectorAll('path')].map((path) => getComputedStyle(path).stroke),
      ),
    icons,
  )
  expect(strokes.length).toBeGreaterThan(0)
  expect(new Set(strokes)).toEqual(new Set(['rgb(200, 30, 90)']))
})

test('a current tab whose bar forced colors hide fails', async () => {
  // the bar a fill of the brand color, which forced colors paint in the page's color
  await page.addStyleTag({
    content: `@media (forced-colors: active) {
      .tabs [data-slot='indicator'] {
        forced-color-adjust: auto !important;
        background-color: var(--ws-color-brand) !important;
      }
    }`,
  })
  const { failures } = await checkSpec(page, 'tabs')
  expect(where(failures)).toEqual([
    ['forced-colors', 'dark', 'tabs.link.current'],
    ['forced-colors', 'light', 'tabs.link.current'],
  ])
  expect(failures[0]!.message).toBe(
    'tabs.link.current looks the same as tabs.link.rest in forced colors: trigger, indicator',
  )
})

/**
 * The tabs' gallery drawn as Nuxt UI draws its link tabs: one bar for the row, a child of the
 * list under the current tab, on the row's line under a padded list, so the bar is outside the
 * tab's box, and under the row the current tab's panel, so the panel of each example is another
 * tab's. With `equal`, each tab takes an equal share of the row, as two labels of as many letters
 * in mono with an icon each would, so the bar under the current tab of each example is as wide
 * as the other. With `taller`, the first tab's panel has a line more than the second's.
 */
async function tabsWithTheBarInTheList(page: Page, { equal = false, taller = false } = {}) {
  await page.evaluate(
    ({ equal, taller }) => {
      const panels = [
        ['The overview of the event.', ...(taller ? ['Where it is, and when.'] : [])],
        ['The settings of the event.'],
      ]
      for (const list of document.querySelectorAll<HTMLElement>('.tabs__list')) {
        Object.assign(list.style, { position: 'relative', padding: '4px' })
        const tabs = [...list.querySelectorAll<HTMLElement>('[data-slot="trigger"]')]
        if (equal) for (const tab of tabs) tab.style.flex = '1 1 0'
        const bar = list.querySelector<HTMLElement>('[data-slot="indicator"]')!
        const tab = bar.closest<HTMLElement>('[data-slot="trigger"]')!
        list.append(bar)
        Object.assign(bar.style, {
          insetInline: 'auto',
          left: `${tab.offsetLeft}px`,
          width: `${tab.offsetWidth}px`,
        })
        const panel = list.parentElement!.appendChild(document.createElement('div'))
        panel.setAttribute('role', 'tabpanel')
        panel.dataset.slot = 'content'
        for (const line of panels[tabs.indexOf(tab)]!)
          panel.appendChild(document.createElement('p')).textContent = line
      }
    },
    { equal, taller },
  )
}

for (const [tabs, equal] of [
  ['as wide as their labels', false],
  ['of one width', true],
] as const)
  for (const [panels, taller] of [
    ['of one height', false],
    ['of two heights', true],
  ] as const)
    test(`a current tab whose bar is outside its box passes, and fails once forced colors hide it, with tabs ${tabs} and panels ${panels}`, async () => {
      await tabsWithTheBarInTheList(page, { equal, taller })
      await expectSpec(page, 'tabs', fixture('tabs'))

      await page.addStyleTag({
        content: `@media (forced-colors: active) {
          .tabs [data-slot='indicator'] {
            forced-color-adjust: auto !important;
            background-color: var(--ws-color-brand) !important;
          }
        }`,
      })
      const { failures } = await checkSpec(page, 'tabs', fixture('tabs'))
      expect(where(failures)).toEqual([
        ['forced-colors', 'dark', 'tabs.link.current'],
        ['forced-colors', 'light', 'tabs.link.current'],
      ])
    })
