import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Browser, type Page, expect, test } from '@playwright/test'
import {
  type Failure,
  type Spec,
  checkSpec,
  expectSpec,
  loadSpec,
  specNames,
} from '@whatsaaaa/design-system/testing'

/**
 * The parity helper, as an implementation runs it: the built entry, against a gallery of plain
 * HTML that meets the published specs, and against the same gallery with one thing wrong.
 */
const ORIGIN = 'http://spec-gallery.test'
const root = fileURLToPath(new URL('../..', import.meta.url))
const files: Record<string, string> = {
  '/': 'tests/fixtures/spec-gallery/index.html',
  '/gallery.css': 'tests/fixtures/spec-gallery/gallery.css',
  '/tokens.css': 'dist/tokens.css',
}

/**
 * A spec with the fixture as one of its implementations, whose part map names the parts a
 * pseudo-element draws, as an implementation's does.
 */
const implementation = 'fixture'
const pseudoParts: Record<string, Record<string, string>> = {
  checkbox: { required: 'label::after' },
  input: { placeholder: 'root::placeholder', required: 'label::after' },
  'radio-group': { required: 'legend::after' },
  select: { 'item-highlight': 'item::before' },
  'select-menu': { 'item-highlight': 'item::before' },
}
function fixture(name: string): Spec {
  const spec = loadSpec(name)
  const parts = pseudoParts[name] ?? {}
  return {
    ...spec,
    implementations: {
      ...spec.implementations,
      [implementation]: { library: 'plain HTML', status: 'shipped', parity: 'passing', parts },
    },
  }
}

async function gallery(browser: Browser) {
  const context = await browser.newContext()
  await context.route(`${ORIGIN}/**`, (route) => {
    const file = files[new URL(route.request().url()).pathname]
    return file ? route.fulfill({ path: join(root, file) }) : route.fulfill({ status: 404 })
  })
  const page = await context.newPage()
  await page.goto(`${ORIGIN}/`)
  return { context, page }
}

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
    'button',
    'checkbox',
    'input',
    'modal',
    'radio-group',
    'select',
    'select-menu',
  ])
  expect(loadSpec('button').component).toBe('button')
  expect(() => loadSpec('../package')).toThrow(/no spec named/)
})

/** How many values each spec's gallery has compared at least, in both themes. */
const leastChecks: Record<string, number> = {
  button: 800,
  checkbox: 300,
  input: 300,
  modal: 50,
  'radio-group': 300,
  select: 1100,
  'select-menu': 1100,
}

for (const name of specNames()) {
  test(`a gallery that meets the ${name} spec passes it in both themes`, async () => {
    const { failures, checks } = await checkSpec(page, fixture(name), { implementation })
    expect(failures).toEqual([])
    // every row a gallery example holds for is measured in each theme, so a gallery that draws
    // less fails
    expect(checks).toBeGreaterThan(leastChecks[name]!)
  })
}

test('it reads the parts an implementation maps in the spec', async () => {
  // ui-vue draws the button's parts in Nuxt UI's slots: root is base, an icon leadingIcon
  await page.evaluate(() => {
    const slots: Record<string, string> = {
      root: 'base',
      'leading-icon': 'leadingIcon',
      'trailing-icon': 'trailingIcon',
    }
    for (const element of document.querySelectorAll<HTMLElement>('[data-spec^="button."] *'))
      element.dataset.slot = slots[element.dataset.slot!] ?? element.dataset.slot
  })
  await expectSpec(page, 'button', { implementation: 'ui-vue' })
  const { failures } = await checkSpec(page, 'button')
  expect(failures.every(({ check }) => check === 'coverage')).toBe(true)
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
  const { failures } = await checkSpec(page, fixture('input'), { implementation })
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
  const { failures } = await checkSpec(page, fixture('input'), { implementation })
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
  const { failures } = await checkSpec(page, fixture('input'), { implementation })
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
  const { failures } = await checkSpec(page, fixture('input'), { implementation })
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
  const { failures } = await checkSpec(page, fixture('input'), { implementation })
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
  const { failures } = await checkSpec(page, fixture('input'), { implementation })
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
      box-shadow: inset 0 0 0 var(--ws-overlay-border-width) var(--ws-overlay-border);
    }`,
  })
  const { failures } = await checkSpec(page, fixture('select'), { implementation })
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

test('a part is measured where the example draws it, in the option that is checked', async () => {
  // the checked option of a disabled group, its second, in the fill of an enabled one
  await page.addStyleTag({
    content: `[data-spec='radio-group.list.disabled'] input:checked + [data-slot='indicator'] {
      background-color: var(--ws-choice-indicator-bg-checked) !important;
    }`,
  })
  const { failures } = await checkSpec(page, fixture('radio-group'), { implementation })
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
  const { failures } = await checkSpec(page, fixture('checkbox'), { implementation })
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

test('a selected example that looks the same as the one at rest in forced colors fails', async () => {
  // a spec with a selected state, which no published spec has yet
  const tab: Spec = {
    ...loadSpec('button'),
    component: 'tab',
    parts: { root: 'The tab, with its label.' },
    variants: { default: 'The one kind.' },
    sizes: { md: 'Every tab.' },
    defaultSize: 'md',
    states: { rest: 'Not chosen.', selected: 'The one shown.' },
    stateTable: [
      {
        variant: '*',
        state: 'rest',
        part: 'root',
        property: 'background-color',
        token: 'field.bg',
      },
      { variant: '*', state: 'rest', part: 'root', property: 'color', token: 'color.text' },
      {
        variant: '*',
        state: 'selected',
        part: 'root',
        property: 'background-color',
        token: 'color.interactive',
      },
      { variant: '*', state: 'selected', part: 'root', property: 'color', token: 'color.bg' },
    ],
    implementations: {},
    gallery: ['tab.default.rest', 'tab.default.selected'],
  }
  await page.evaluate(() =>
    document.body.insertAdjacentHTML(
      'beforeend',
      `<section class="tabs">
        <div data-spec="tab.default.rest"><span class="tab" data-slot="root">Overview</span></div>
        <div data-spec="tab.default.selected">
          <span class="tab" data-slot="root" aria-selected="true">Overview</span>
        </div>
      </section>`,
    ),
  )
  // the selected tab half a pixel off the one at rest, so its label is drawn at another fraction
  // of a pixel and its image is cut a pixel apart
  await page.addStyleTag({
    content: `.tabs { flex-direction: column; }
    .tab {
      display: block;
      padding: 0.5rem 0.75rem;
      background-color: var(--ws-field-bg);
      color: var(--ws-color-text);
      font-size: var(--ws-text-label-font-size);
    }
    .tab[aria-selected='true'] {
      background-color: var(--ws-color-interactive);
      color: var(--ws-color-bg);
    }
    [data-spec='tab.default.selected'] { margin-inline-start: 0.5px; }`,
  })
  // forced colors paint every background in the page's color and every label in its text color,
  // so the two look alike
  expect(where((await checkSpec(page, tab)).failures)).toEqual([
    ['forced-colors', 'dark', 'tab.default.selected'],
    ['forced-colors', 'light', 'tab.default.selected'],
  ])

  await page.addStyleTag({
    content: `@media (forced-colors: active) {
      .tab[aria-selected='true'] {
        forced-color-adjust: none;
        background-color: Highlight;
        color: HighlightText;
      }
    }`,
  })
  await expectSpec(page, tab)
})
