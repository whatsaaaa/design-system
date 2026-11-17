/**
 * The parity helper: an implementation's browser test holds its gallery to the published
 * component specs with it, whatever its framework. In each theme it checks
 *
 * - coverage: every example of the spec's gallery is on the page, marked with its id in
 *   `data-spec`, and every row of the state table is drawn by an example it holds for;
 * - tokens: each property of each part of each example is the token's value, resolved next to
 *   the part, so a part of the page held in the other theme is measured in it;
 * - forced colors: each part with an edge keeps a border or an outline, and a checked, current or
 *   selected example still looks unlike the example of its kind at rest.
 *
 * A state a pointer or the keyboard causes is forced as the gallery contract says, with
 * `data-demo`, never with the pointer: the helper adds `data-demo="hover"` to the example of a
 * hover state while it measures, and the gallery draws it as hover.
 */
import { type Page, expect, test } from '@playwright/test'
import {
  type Expectation,
  type Spec,
  cssVariable,
  describeRow,
  example,
  expectations,
  loadSpec,
} from './spec.ts'

export { cssVariable, example, expectations, loadSpec, rowVariants, specNames } from './spec.ts'
export type { Example, Expectation, Implementation, Size, Spec, SpecRow } from './spec.ts'

export type Theme = 'dark' | 'light'

export interface SpecOptions {
  /**
   * The implementation in the spec whose part map names the `data-slot` that draws each part,
   * such as `ui-vue`, where `root` is `base`. Without one, a part's slot is its name.
   */
  implementation?: string
  /**
   * Parts mapped here, over the implementation's: a slot, or a slot and a pseudo-element of it
   * that draws the part, such as `label::after` or `root::placeholder`.
   */
  parts?: Record<string, string>
  /** The themes to check in, both by default. */
  themes?: Theme[]
  /**
   * Puts the page in a theme. By default it sets `data-theme` on `<html>`, which wins over a
   * `dark` or `light` class there, and emulates the system's color scheme to match.
   */
  setTheme?: (page: Page, theme: Theme) => Promise<void>
}

export type Check = 'coverage' | 'tokens' | 'forced-colors'

export interface Failure {
  check: Check
  /** The theme it failed in, or none for what holds in every theme. */
  theme?: Theme
  /** The gallery id of the example, where it is one example's. */
  id?: string
  message: string
}

export interface SpecReport {
  component: string
  /** How many property values were compared with their tokens, in every theme. */
  checks: number
  failures: Failure[]
}

/** The states a pointer or the keyboard causes, which a gallery draws on `data-demo`. */
const demoStates = ['hover', 'active', 'focus']

/** The states that the forced-colors check compares with rest. */
const markedStates = ['checked', 'current', 'selected']

/** Where a part is drawn: the element with its `data-slot`, or a pseudo-element of it. */
interface Target {
  slot: string
  pseudo?: string
}

/** One property of one part to measure, and the token or value it has to have. */
interface Measure {
  target: Target
  property: string
  variable?: string
  value?: string
}

interface Measured {
  /** Whether the example draws the part. */
  drawn: boolean
  actual?: string
  expected?: string
  /** Whether the page declares the token's variable where the part is. */
  declared?: boolean
  same?: boolean
}

export const formatFailure = ({ check, theme, message }: Failure): string =>
  `${theme ?? 'every theme'}, ${check}: ${message}`

/**
 * Checks the gallery in the page against a spec, by its name or as data, and reports every
 * failure. The page is open at the gallery. It is left in the last theme checked.
 */
export async function checkSpec(
  page: Page,
  spec: string | Spec,
  options: SpecOptions = {},
): Promise<SpecReport> {
  const data = typeof spec === 'string' ? loadSpec(spec) : spec
  const { component } = data
  const targets = partTargets(data, options)
  const failures: Failure[] = []
  let checks = 0

  const marked = await page.evaluate(() =>
    [...document.querySelectorAll('[data-spec]')].map((element) =>
      element.getAttribute('data-spec'),
    ),
  )
  const shown = data.gallery.filter((id) => marked.includes(id))
  for (const id of data.gallery.filter((id) => !shown.includes(id)))
    failures.push({
      check: 'coverage',
      id,
      message: `${id} has no example: no element has data-spec="${id}"`,
    })
  for (const id of new Set(marked))
    if (id?.startsWith(`${component}.`) && !data.gallery.includes(id))
      failures.push({
        check: 'coverage',
        id,
        message: `data-spec="${id}" is not an example of the ${component} spec's gallery`,
      })

  const examples = shown.map((id) => {
    const held = expectations(data, example(data, id))
    return { id, held, measures: held.map((expectation) => measure(expectation, targets)) }
  })

  await page.evaluate(forceDemoStates, { component, states: demoStates })
  try {
    for (const theme of options.themes ?? ['dark', 'light']) {
      await (options.setTheme ?? setTheme)(page, theme)
      const results = await page.evaluate(
        measureInPage,
        examples.map(({ id, measures }) => ({ id, measures })),
      )

      // every row that holds for an example on the page, and the rows that one of them draws
      const held = new Map<number, string[]>()
      const drawn = new Set<number>()
      examples.forEach(({ id, held: expected }, which) => {
        expected.forEach((expectation) =>
          held.set(expectation.index, [...(held.get(expectation.index) ?? []), id]),
        )
        for (const elements of results[which]!)
          elements.forEach((result, index) => {
            const expectation = expected[index]!
            if (!result.drawn) return
            drawn.add(expectation.index)
            checks++
            const failure = tokenFailure(id, expectation, result)
            if (failure) failures.push({ check: 'tokens', theme, id, message: failure })
          })
      })
      for (const [index, ids] of held)
        if (!drawn.has(index)) {
          const row = data.stateTable[index]!
          failures.push({
            check: 'coverage',
            theme,
            message: `no example draws ${row.part} where the row "${describeRow(row)}" holds: ${ids.join(', ')}`,
          })
        }

      await page.emulateMedia({ forcedColors: 'active' })
      try {
        const edges = examples.flatMap(({ id, held: expected }, which) =>
          edgesOf(expected, results[which]![0] ?? []).map(({ part, edge }) => ({
            id,
            part,
            target: targets[part]!,
            edge,
          })),
        )
        for (const { id, message } of await page.evaluate(edgesInPage, edges))
          failures.push({ check: 'forced-colors', theme, id, message })
        for (const failure of await marksDiffer(page, data, targets, shown))
          failures.push({ ...failure, check: 'forced-colors', theme })
      } finally {
        await page.emulateMedia({ forcedColors: null })
      }
    }
  } finally {
    await page.evaluate(restoreDemoStates)
  }
  return { component, checks, failures }
}

/**
 * Checks the gallery in the page against a spec, as a step of the test, and fails it with every
 * failure listed.
 */
export async function expectSpec(
  page: Page,
  spec: string | Spec,
  options: SpecOptions = {},
): Promise<void> {
  const name = typeof spec === 'string' ? spec : spec.component
  await test.step(`the gallery meets the ${name} spec`, async () => {
    const { failures, checks } = await checkSpec(page, spec, options)
    expect(
      failures.map(formatFailure),
      `${failures.length} failures, with ${checks} values compared`,
    ).toEqual([])
  })
}

/** The default way into a theme: `data-theme` on `<html>`, and the system's scheme to match. */
async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.emulateMedia({ colorScheme: theme })
  await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), theme)
}

/** Where each part of the spec is drawn, from the implementation's map and the options. */
function partTargets(spec: Spec, { implementation, parts = {} }: SpecOptions) {
  const mapped = implementation ? spec.implementations[implementation]?.parts : {}
  if (!mapped) throw new Error(`the ${spec.component} spec has no parts for ${implementation}`)
  return Object.fromEntries(
    Object.keys(spec.parts).map((part) => {
      const [slot = part, pseudo] = (parts[part] ?? mapped[part] ?? part).split(/(?=::)/)
      return [part, pseudo ? { slot, pseudo } : { slot }]
    }),
  ) as Record<string, Target>
}

const measure = ({ part, property, row }: Expectation, targets: Record<string, Target>) => ({
  target: targets[part]!,
  property,
  ...(row.token === undefined ? { value: row.value } : { variable: cssVariable(row) }),
})

/** Why a measured value fails its row, or nothing when it holds. */
function tokenFailure(id: string, { part, property, row }: Expectation, result: Measured) {
  const what = `${id}: ${part} ${property} is ${result.actual}`
  if (row.token === undefined)
    return result.same ? undefined : `${what}, and the spec says ${row.value} (${result.expected})`
  const variable = cssVariable(row)
  if (!result.declared)
    return `${what}, and ${variable}, the token ${row.token}, is not declared there`
  return result.same ? undefined : `${what}, and ${row.token} (${variable}) is ${result.expected}`
}

/**
 * The edges an example's parts have by the spec: a border where its width is more than none, an
 * outline where the outline's is, read from the values just measured.
 */
type Edge = 'border' | 'outline'

function edgesOf(expected: Expectation[], results: Measured[]): { part: string; edge: Edge }[] {
  const value = (part: string, property: string) => {
    const index = expected.findIndex((one) => one.part === part && one.property === property)
    return index < 0 ? undefined : results[index]
  }
  const has = (part: string, line: Edge) => {
    const width = value(part, `${line}-width`)
    const style = value(part, `${line}-style`)
    return (
      !!width?.drawn &&
      parseFloat(width.expected ?? '0') > 0 &&
      !['none', 'hidden'].includes(style?.expected ?? 'solid')
    )
  }
  return [...new Set(expected.map(({ part }) => part))].flatMap((part) => {
    const edge: Edge | undefined = has(part, 'outline')
      ? 'outline'
      : has(part, 'border')
        ? 'border'
        : undefined
    return edge ? [{ part, edge }] : []
  })
}

/**
 * In forced colors, each checked, current or selected example still looks unlike the example of
 * its kind and size at rest: an image of at least one part its state changes differs. The two
 * examples show the same content, as the gallery contract says, so only the state can differ.
 */
async function marksDiffer(
  page: Page,
  spec: Spec,
  targets: Record<string, Target>,
  shown: string[],
): Promise<Omit<Failure, 'check'>[]> {
  const failures: Omit<Failure, 'check'>[] = []
  const part = (id: string, part: string) =>
    page
      .locator(`[data-spec="${id}"]`)
      .first()
      .locator(`xpath=descendant-or-self::*[@data-slot="${targets[part]!.slot}"]`)
      .first()
  for (const id of shown) {
    const { variant, state, size } = example(spec, id)
    if (!markedStates.includes(state)) continue
    const rest = [spec.component, variant, 'rest', ...(size === spec.defaultSize ? [] : [size])]
    const restId = rest.join('.')
    if (!shown.includes(restId)) {
      failures.push({ id, message: `${id} has no example at rest to differ from: ${restId}` })
      continue
    }
    const parts = expectations(spec, example(spec, id))
      .filter(({ row }) => row.state === state)
      .map((expectation) => expectation.part)
    let compared = 0
    let differs = false
    for (const name of new Set(parts.length ? parts : ['root'])) {
      const [marked, resting] = [part(id, name), part(restId, name)]
      if (!(await marked.count()) || !(await resting.count())) continue
      compared++
      const [one, other] = await Promise.all(
        [marked, resting].map((locator) => locator.screenshot({ animations: 'disabled' })),
      )
      if (!one!.equals(other!)) differs = true
    }
    if (!compared)
      failures.push({ id, message: `neither ${id} nor ${restId} draws ${parts.join(', ')}` })
    else if (!differs)
      failures.push({
        id,
        message: `${id} looks the same as ${restId} in forced colors: ${[...new Set(parts)].join(', ')}`,
      })
  }
  return failures
}

// What follows runs in the page, so each function holds all it needs.

/** Adds the state of each hover, active and focus example of the spec to its `data-demo`. */
function forceDemoStates({ component, states }: { component: string; states: string[] }) {
  for (const element of document.querySelectorAll<HTMLElement>('[data-spec]')) {
    const [name, , state] = element.dataset.spec!.split('.')
    if (name !== component || !state || !states.includes(state)) continue
    const demo = (element.dataset.demo ?? '').split(/\s+/).filter(Boolean)
    if (demo.includes(state)) continue
    element.dataset.demo = [...demo, state].join(' ')
    element.dataset.specForced = state
  }
}

/** Takes away what forceDemoStates added. */
function restoreDemoStates() {
  for (const element of document.querySelectorAll<HTMLElement>('[data-spec-forced]')) {
    const demo = element.dataset
      .demo!.split(/\s+/)
      .filter((one) => one !== element.dataset.specForced)
    if (demo.length) element.dataset.demo = demo.join(' ')
    else delete element.dataset.demo
    delete element.dataset.specForced
  }
}

/**
 * Measures each property of each part of each example, for every element marked with the
 * example's id, and resolves its token or value on a probe next to the part.
 */
function measureInPage(examples: { id: string; measures: Measure[] }[]): Measured[][][] {
  // a state forced a moment ago may still be on its way: end every transition
  for (const animation of document.getAnimations())
    if ('transitionProperty' in animation) animation.finish()

  const colorProperties = ['background-color', 'color', 'border-color', 'outline-color']
  const probe = document.createElement('ws-spec-probe')
  const base =
    'position:absolute;display:block;visibility:hidden;pointer-events:none;' +
    'forced-color-adjust:none;border-style:solid;outline-style:solid'
  const read = (element: Element, pseudo: string | undefined, property: string) =>
    getComputedStyle(element, pseudo).getPropertyValue(property).trim()

  // the part, where the example draws it
  const find = (root: Element, { slot, pseudo }: Target) => {
    const selector = `[data-slot="${CSS.escape(slot)}"]`
    const element = root.matches(selector) ? root : root.querySelector(selector)
    if (!element?.checkVisibility()) return undefined
    if (pseudo === '::before' || pseudo === '::after')
      return ['none', 'normal'].includes(read(element, pseudo, 'content')) ? undefined : element
    if (pseudo === '::placeholder')
      return (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
        element.placeholder &&
        !element.value
        ? element
        : undefined
    return element
  }

  // where the probe goes: in the part, so it sees the variables the part sees, or next to it
  // where the part cannot hold an element
  const empty = ['INPUT', 'TEXTAREA', 'SELECT', 'IMG', 'BR', 'HR', 'IFRAME', 'CANVAS', 'VIDEO']
  const home = (element: Element) => {
    let at: Element | null = element
    if (element instanceof HTMLElement && empty.includes(element.tagName))
      at = element.parentElement
    while (at && !(at instanceof HTMLElement)) at = at.parentElement
    return at ?? document.body
  }

  const color = (value: string) => {
    probe.style.cssText = base
    probe.style.color = `color-mix(in srgb, ${value}, ${value})`
    const channels = (getComputedStyle(probe).color.match(/-?[\d.]+(e-?\d+)?/g) ?? []).map(Number)
    return channels.length === 3 ? [...channels, 1] : channels
  }
  const same = (property: string, actual: string, expected: string) => {
    if (colorProperties.includes(property)) {
      const [one, other] = [color(actual), color(expected)]
      if (one.length !== 4 || other.length !== 4) return actual === expected
      // a color with no alpha has no channels to see
      if (one[3]! <= 0.005 && other[3]! <= 0.005) return true
      return one.every((channel, index) => Math.abs(channel - other[index]!) <= 0.005)
    }
    const length = /^(-?[\d.]+)px$/
    const [one, other] = [length.exec(actual), length.exec(expected)]
    // a length can be off by the browser's layout unit, a 64th of a pixel
    if (one && other) return Math.abs(Number(one[1]) - Number(other[1])) <= 1 / 64
    return actual === expected
  }

  return examples.map(({ id, measures }) =>
    [...document.querySelectorAll(`[data-spec="${CSS.escape(id)}"]`)].map((root) => {
      // read every part before a probe is in it
      const parts = measures.map(({ target, property }) => {
        const element = find(root, target)
        return element && { element, actual: read(element, target.pseudo, property) }
      })
      return measures.map(({ target, property, variable, value }, index): Measured => {
        const part = parts[index]
        if (!part) return { drawn: false }
        home(part.element).append(probe)
        probe.style.cssText = base
        if (property !== 'font-size')
          probe.style.fontSize = read(part.element, target.pseudo, 'font-size')
        probe.style.setProperty(property, variable ? `var(${variable})` : value!)
        const expected = read(probe, undefined, property)
        const declared = variable ? read(probe, undefined, variable) !== '' : true
        const result = {
          drawn: true,
          actual: part.actual,
          expected,
          declared,
          same: declared && same(property, part.actual, expected),
        }
        probe.remove()
        return result
      })
    }),
  )
}

/**
 * In forced colors, each part with an edge by the spec draws one: a border on every side, or an
 * outline, in a color that is not the page's. A focus ring has to stay an outline.
 */
function edgesInPage(
  edges: { id: string; part: string; target: Target; edge: Edge }[],
): { id: string; message: string }[] {
  for (const animation of document.getAnimations())
    if ('transitionProperty' in animation) animation.finish()

  const probe = document.createElement('ws-spec-probe')
  probe.style.cssText = 'position:absolute;visibility:hidden;forced-color-adjust:none'
  const seen = (color: string, near: Element) => {
    // the page's color where the part is, as the system paints it there
    ;(near.parentElement ?? document.body).append(probe)
    probe.style.backgroundColor = 'Canvas'
    const canvas = getComputedStyle(probe).backgroundColor
    probe.style.backgroundColor = `color-mix(in srgb, ${color}, ${color})`
    const alpha = Number(/\/\s*([\d.]+)\)$/.exec(getComputedStyle(probe).backgroundColor)?.[1] ?? 1)
    probe.remove()
    return alpha > 0 && color !== canvas
  }
  const line = (style: CSSStyleDeclaration, prefix: string, near: Element) =>
    parseFloat(style.getPropertyValue(`${prefix}-width`)) > 0 &&
    !['none', 'hidden'].includes(style.getPropertyValue(`${prefix}-style`)) &&
    seen(style.getPropertyValue(`${prefix}-color`), near)

  const failures: { id: string; message: string }[] = []
  for (const { id, part, target, edge } of edges)
    for (const root of document.querySelectorAll(`[data-spec="${CSS.escape(id)}"]`)) {
      const selector = `[data-slot="${CSS.escape(target.slot)}"]`
      const element = root.matches(selector) ? root : root.querySelector(selector)
      if (!element?.checkVisibility()) continue
      const style = getComputedStyle(element, target.pseudo)
      const outline = line(style, 'outline', element)
      const border = ['top', 'right', 'bottom', 'left'].every((side) =>
        line(style, `border-${side}`, element),
      )
      if (edge === 'outline' ? outline : border || outline) continue
      failures.push({
        id,
        message:
          `${id}: ${part} loses its ${edge} in forced colors: ` +
          `border ${style.borderWidth} ${style.borderStyle} ${style.borderColor}, ` +
          `outline ${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
      })
    }
  return failures
}
