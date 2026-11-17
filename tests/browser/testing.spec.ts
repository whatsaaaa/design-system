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
 * HTML that meets the button and input specs, and against the same gallery with one thing wrong.
 */
const ORIGIN = 'http://spec-gallery.test'
const root = fileURLToPath(new URL('../..', import.meta.url))
const files: Record<string, string> = {
  '/': 'tests/fixtures/spec-gallery/index.html',
  '/gallery.css': 'tests/fixtures/spec-gallery/gallery.css',
  '/tokens.css': 'dist/tokens.css',
}

/** The fixture's parts that a pseudo-element draws, as an implementation maps them. */
const parts = { placeholder: 'root::placeholder', required: 'label::after' }

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
  expect(specNames()).toEqual(['button', 'input'])
  expect(loadSpec('button').component).toBe('button')
  expect(() => loadSpec('../package')).toThrow(/no spec named/)
})

for (const name of ['button', 'input']) {
  test(`a gallery that meets the ${name} spec passes it in both themes`, async () => {
    await expectSpec(page, name, { parts })
    const { checks } = await checkSpec(page, name, { parts, themes: ['dark'] })
    // every row a gallery example holds for is measured, so a gallery that draws less fails
    expect(checks).toBeGreaterThan(name === 'button' ? 400 : 150)
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
  const { failures } = await checkSpec(page, 'button', { parts })
  expect(where(failures)).toEqual([
    ['tokens', 'dark', 'button.primary.hover'],
    ['tokens', 'light', 'button.primary.hover'],
  ])
  expect(failures[0]!.message).toMatch(
    /^button\.primary\.hover: root background-color is rgb\(.+\), and button\.primary\.bg\.hover \(--ws-button-primary-bg-hover\) is rgb\(.+\)$/,
  )
})

test('a token is resolved where the part is, in a part of the page held in the other theme', async () => {
  // the field held in the light theme, drawn with the dark theme's edge: the page's own value
  const dark = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ws-field-border-rest'),
  )
  await page.addStyleTag({
    content: `[data-spec='input.outline.rest.xl'] input { border-color: ${dark}; }`,
  })
  const { failures } = await checkSpec(page, 'input', { parts, themes: ['dark'] })
  expect(where(failures)).toEqual([['tokens', 'dark', 'input.outline.rest.xl']])
  expect(failures[0]!.message).toContain('root border-color')
})

test('a missing example fails, and so does an id the gallery does not have', async () => {
  await page.evaluate(() => {
    document.querySelector('[data-spec="input.outline.invalid"]')!.remove()
    document
      .querySelector('[data-spec="input.outline.hover"]')!
      .setAttribute('data-spec', 'input.outline.hovered')
  })
  const { failures } = await checkSpec(page, 'input', { parts })
  expect(failures.every(({ check }) => check === 'coverage')).toBe(true)
  const messages = failures.map(({ message }) => message)
  expect(messages).toContain(
    'input.outline.hover has no example: no element has data-spec="input.outline.hover"',
  )
  expect(messages).toContain(
    'input.outline.invalid has no example: no element has data-spec="input.outline.invalid"',
  )
  expect(messages).toContain(
    `data-spec="input.outline.hovered" is not an example of the input spec's gallery`,
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
  const { failures } = await checkSpec(page, 'input', { parts, themes: ['dark'] })
  expect(failures.map(({ message }) => message)).toEqual([
    'no example draws help where the row "* rest help font-size at sm" holds: input.outline.rest.sm',
  ])
})

test('a part that loses its edge in forced colors fails', async () => {
  await page.addStyleTag({
    content: `@media (forced-colors: active) {
      .button[data-variant='secondary'] { border-style: none; }
    }`,
  })
  const { failures } = await checkSpec(page, 'button', { parts, themes: ['dark'] })
  // the focused one keeps its outline, which is its edge then
  expect(where(failures)).toEqual(
    ['rest', 'hover', 'active', 'disabled', 'loading'].map((state) => [
      'forced-colors',
      'dark',
      `button.secondary.${state}`,
    ]),
  )
  expect(failures[0]!.message).toMatch(/^button\.secondary\.rest: root loses its border/)
})

test('a checked example that looks the same as the one at rest in forced colors fails', async () => {
  // a spec with a checked state, which neither published spec has yet
  const button = loadSpec('button')
  const toggle: Spec = {
    ...button,
    component: 'toggle',
    parts: { root: 'The box.' },
    variants: { default: 'The one kind.' },
    sizes: { md: 'Every toggle.' },
    defaultSize: 'md',
    states: { rest: 'Off.', checked: 'On.' },
    stateTable: [
      { variant: '*', state: 'rest', part: 'root', property: 'border-style', value: 'solid' },
      {
        variant: '*',
        state: 'rest',
        part: 'root',
        property: 'border-color',
        token: 'field.border.rest',
      },
      {
        variant: '*',
        state: 'rest',
        part: 'root',
        property: 'background-color',
        token: 'field.bg',
      },
      {
        variant: '*',
        state: 'checked',
        part: 'root',
        property: 'background-color',
        token: 'color.interactive',
      },
    ],
    implementations: {},
    gallery: ['toggle.default.rest', 'toggle.default.checked'],
  }
  await page.evaluate(() =>
    document.body.insertAdjacentHTML(
      'beforeend',
      `<section>
        <div data-spec="toggle.default.rest"><span class="toggle" data-slot="root"></span></div>
        <div data-spec="toggle.default.checked">
          <span class="toggle" data-slot="root" aria-checked="true"></span>
        </div>
      </section>`,
    ),
  )
  await page.addStyleTag({
    content: `.toggle {
      display: block;
      width: 2rem;
      height: 1rem;
      border: 1px solid var(--ws-field-border-rest);
      background-color: var(--ws-field-bg);
    }
    .toggle[aria-checked='true'] { background-color: var(--ws-color-interactive); }`,
  })
  // forced colors paint every background in the page's color, so the two look alike
  expect(where((await checkSpec(page, toggle)).failures)).toEqual([
    ['forced-colors', 'dark', 'toggle.default.checked'],
    ['forced-colors', 'light', 'toggle.default.checked'],
  ])

  await page.addStyleTag({
    content: `@media (forced-colors: active) {
      .toggle[aria-checked='true'] { forced-color-adjust: none; background-color: Highlight; }
    }`,
  })
  await expectSpec(page, toggle)
})
