/**
 * The parity helper: an implementation's browser test holds its gallery to the published
 * component specs with it, whatever its framework. In each theme it checks
 *
 * - coverage: every example of the spec's gallery is on the page, marked with its id in
 *   `data-spec`, and every row of the state table is drawn by an example it holds for, one that
 *   draws the part of its condition, or does not, where it has one;
 * - tokens: each property of each part of each example is the token's value, resolved next to
 *   the part, so a part of the page held in the other theme is measured in it;
 * - forced colors: each part with an edge keeps a border or an outline, each part with a line on
 *   one side, such as a separator's block-end border, keeps a border on that side, and a checked,
 *   indeterminate, current or selected example still looks unlike the example of its kind at rest.
 *
 * A state a pointer or the keyboard causes is forced as the gallery contract says, with
 * `data-demo`, never with the pointer: the helper adds `data-demo="hover"` to the example of a
 * hover state while it measures, and the gallery draws it as hover.
 */
import { type Locator, type Page, expect, test } from '@playwright/test'
import {
  type Expectation,
  type Spec,
  type Target,
  cssVariable,
  describeCondition,
  describeRow,
  example,
  expectations,
  loadSpec,
  partTargets,
  rowCondition,
} from './spec.ts'

export { loadSpec, specNames } from './spec.ts'
export type { Spec } from './spec.ts'

type Theme = 'dark' | 'light'

export interface SpecOptions {
  /**
   * The implementation's map of the parts it draws under another name than the spec's: for each,
   * the `data-slot` that draws it, a slot and a pseudo-element of it, or a slot inside another.
   * With `{ root: 'base', required: 'label::after', 'leading-icon': 'base leadingIcon' }`, the
   * root is the slot `base`, the required mark the label's `::after`, and the leading icon the
   * `leadingIcon` inside `base`, the icon of a select menu's trigger and not of the search in its
   * list. A part the map does not name is the slot of its own name. A map that names a part the
   * spec does not have is an error.
   */
  parts?: Record<string, string>
}

type Check = 'coverage' | 'tokens' | 'forced-colors'

export interface Failure {
  check: Check
  /** The theme it failed in, or none for what holds in every theme. */
  theme?: Theme
  /** The gallery id of the example, where it is one example's. */
  id?: string
  message: string
}

interface SpecReport {
  component: string
  /** How many property values were compared with their tokens, in every theme. */
  checks: number
  failures: Failure[]
}

/** The states a pointer or the keyboard causes, which a gallery draws on `data-demo`. */
const demoStates = ['hover', 'active', 'focus']

/** The states that the forced-colors check compares with rest. */
const markedStates = ['checked', 'indeterminate', 'current', 'selected']

/**
 * One property of one part to measure, and the token or value it has to have, where the example
 * draws the part of its condition, or does not.
 */
interface Measure {
  part: string
  target: Target
  property: string
  when?: { target: Target; drawn: boolean }
  variable?: string
  value?: string
}

interface Measured {
  /** Whether the example draws the part, where its row holds. */
  drawn: boolean
  actual?: string
  expected?: string
  /** Whether the page declares the token's variable where the part is. */
  declared?: boolean
  same?: boolean
}

const formatFailure = ({ check, theme, message }: Failure): string =>
  `${theme ?? 'every theme'}, ${check}: ${message}`

/**
 * Checks the gallery in the page against a spec, by its name or as data, and reports every
 * failure. The page is open at the gallery. It is left in the light theme, the last checked.
 */
export async function checkSpec(
  page: Page,
  spec: string | Spec,
  options: SpecOptions = {},
): Promise<SpecReport> {
  const data = typeof spec === 'string' ? loadSpec(spec) : spec
  const { component } = data
  // an option it does not know, such as the `implementation` it once took, would be left unread
  // and the gallery checked without its map
  const unknown = Object.keys(options).filter((option) => option !== 'parts')
  if (unknown.length)
    throw new Error(
      `the parity helper has no option ${unknown.join(', ')}: its one option is parts, ` +
        "the implementation's own map of the parts it draws under another name",
    )
  const targets = partTargets(data, options.parts)
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

  const examples = shown.map((id) => {
    const held = expectations(data, example(data, id))
    return { id, held, measures: held.map((expectation) => measure(expectation, targets)) }
  })

  await page.evaluate(forceDemoStates, { component, states: demoStates })
  try {
    for (const theme of ['dark', 'light'] as const) {
      await setTheme(page, theme)
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
          const part = [row.part, describeCondition(row)].filter(Boolean).join(' ')
          failures.push({
            check: 'coverage',
            theme,
            message: `no example draws ${part} where the row "${describeRow(row)}" holds: ${ids.join(', ')}`,
          })
        }

      await page.emulateMedia({ forcedColors: 'active' })
      try {
        // of each element marked with the example's id, as the rows that hold differ between two,
        // such as a card's body, whose line is drawn only above a footer
        const edges = examples.flatMap(({ id, held: expected }, which) =>
          results[which]!.flatMap((elements, element) =>
            edgesOf(expected, elements).map(({ part, edge }) => ({
              id,
              element,
              part,
              target: targets[part]!,
              edge,
            })),
          ),
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

/** Puts the page in a theme: `data-theme` on `<html>`, and the system's scheme to match. */
async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.emulateMedia({ colorScheme: theme })
  await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), theme)
}

function measure({ part, property, row }: Expectation, targets: Record<string, Target>): Measure {
  const condition = rowCondition(row)
  return {
    part,
    target: targets[part]!,
    property,
    ...(condition && { when: { target: targets[condition.part]!, drawn: condition.drawn } }),
    ...(row.token === undefined ? { value: row.value } : { variable: cssVariable(row) }),
  }
}

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
 * An edge a part has by the spec: a border on every side, an outline, or the border of its block
 * end, the line of a separator. The block end is the one side the spec format gives a line of its
 * own: a side the schema adds later is added here in the same change.
 */
type Edge = 'border' | 'outline' | 'border-block-end'

/**
 * The edges an example's parts have by the spec: a border where its width is more than none, an
 * outline where the outline's is, and a border on the block end where that side's is, read from
 * the values just measured. A focus ring is the outline, and a line on one side stays its own edge
 * beside it.
 */
function edgesOf(expected: Expectation[], results: Measured[]): { part: string; edge: Edge }[] {
  // of the rows of a property, the one that holds where the example is
  const value = (part: string, property: string) =>
    results.find(
      (result, index) =>
        result.drawn && expected[index]!.part === part && expected[index]!.property === property,
    )
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
    const edges: Edge[] = []
    if (has(part, 'outline')) edges.push('outline')
    else if (has(part, 'border')) edges.push('border')
    // a border on every side covers each side, so a part with one has no side of its own to check
    if (!has(part, 'border') && has(part, 'border-block-end')) edges.push('border-block-end')
    return edges.map((edge) => ({ part, edge }))
  })
}

/**
 * In forced colors, each checked, indeterminate, current or selected example still looks unlike
 * the example of its kind and size at rest: an image of at least one part its state changes
 * differs. Of a part at another size or place than at rest, such as the bar under another tab,
 * the closest elements around it in the two that are at one size and place are compared, such
 * as the row of tabs, and not the panel under it, which is another tab's at rest. Where the state
 * draws a part the example at rest does not, such as a checked box's fill, the two examples are
 * compared whole. They show the same content, as the gallery contract says, so only the state
 * can differ.
 */
async function marksDiffer(
  page: Page,
  spec: Spec,
  targets: Record<string, Target>,
  shown: string[],
): Promise<Omit<Failure, 'check'>[]> {
  const failures: Omit<Failure, 'check'>[] = []
  // the part, where the example draws it
  const part = (id: string, name: string) => {
    const [example, slot] = [`[data-spec="${id}"]`, targets[name]!.selector]
    return page.locator(`${example}${slot}:visible, ${example} ${slot}:visible`).first()
  }
  const whole = (id: string) => page.locator(`[data-spec="${id}"]:visible`).first()
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
    let onlyMarked = false
    const compare = async (marked: Locator, resting: Locator): Promise<void> => {
      const images = await Promise.all([marked, resting].map(shot))
      const alike = await page.evaluate(looksAlike, images)
      if (alike !== undefined) {
        compared++
        if (!alike) differs = true
      } else if (!images.some((image) => image.outermost))
        // a part of another size, or at another place in its example, is not the same part in
        // another state, such as the bar under another tab: the elements around the two are
        // compared in its place
        await compare(marked.locator('..'), resting.locator('..'))
    }
    for (const name of new Set(parts.length ? parts : ['root'])) {
      const [marked, resting] = [part(id, name), part(restId, name)]
      const [drawn, drawnAtRest] = [await marked.count(), await resting.count()]
      if (drawn && !drawnAtRest) onlyMarked = true
      if (drawn && drawnAtRest) await compare(marked, resting)
    }
    if ((onlyMarked || !compared) && !differs) await compare(whole(id), whole(restId))
    if (!compared)
      failures.push({
        id,
        message: `${id} and ${restId} do not both draw ${[...new Set(parts)].join(', ')} at one size and place`,
      })
    else if (!differs)
      failures.push({
        id,
        message: `${id} looks the same as ${restId} in forced colors: ${[...new Set(parts)].join(', ')}`,
      })
  }
  return failures
}

/**
 * An image of an element, as a PNG in base64, and the pixels of it that the element covers at
 * least half of. The image takes in every pixel the element touches, so of an element at a
 * fraction of a pixel and the same element at a whole one, only the first would take in a line
 * of its neighbor, such as the line under a row of a table: only the pixels it covers are
 * compared. With them, where the element is in its example, from the example's corner, and
 * whether it is the example itself, with nothing of the example around it.
 */
interface Shot {
  png: string
  covered: { x: number; y: number; width: number; height: number }
  at: { x: number; y: number }
  outermost: boolean
}

/** The image of an element, the pixels of it the element covers, and where it is in its example. */
async function shot(locator: Locator): Promise<Shot> {
  // in CSS pixels, as the box is, whatever the device's pixel ratio
  const png = (await locator.screenshot({ animations: 'disabled', scale: 'css' })).toString(
    'base64',
  )
  const box = await locator.evaluate((element) => {
    const { left, top, right, bottom } = element.getBoundingClientRect()
    const outer = element.closest('[data-spec]')!
    const example = outer.getBoundingClientRect()
    return {
      left: left + scrollX,
      top: top + scrollY,
      right: right + scrollX,
      bottom: bottom + scrollY,
      at: { x: left - example.left, y: top - example.top },
      outermost: element === outer,
    }
  })
  const [left, top] = [Math.round(box.left), Math.round(box.top)]
  return {
    png,
    at: box.at,
    outermost: box.outermost,
    covered: {
      x: left - Math.floor(box.left),
      y: top - Math.floor(box.top),
      width: Math.max(Math.round(box.right) - left, 1),
      height: Math.max(Math.round(box.bottom) - top, 1),
    },
  }
}

// What follows runs in the page, so each function holds all it needs.

/**
 * Whether two images, of a part in two examples, look alike: once each is blurred over the
 * pixels around, every pixel of either is within a quarter of each channel of a pixel of the
 * other at most a pixel away. Text drawn at another fraction of a pixel, and an image cut a pixel
 * apart, look alike, while a line of a pixel in a color of its own does not. Images more than a
 * pixel apart in size, or in where they are in their examples, are of two parts, not of one in two
 * states: nothing, for them.
 */
async function looksAlike(images: Shot[]): Promise<boolean | undefined> {
  const [here, there] = images.map(({ at }) => at)
  if (Math.abs(here!.x - there!.x) > 1 || Math.abs(here!.y - there!.y) > 1) return undefined
  const decode = async ({ png, covered }: Shot) => {
    const bytes = Uint8Array.from(atob(png), (char) => char.charCodeAt(0))
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
    // the pixels the element covers, where the image is of every pixel it touches
    const { x: left, y: top, width, height } = covered
    const context = new OffscreenCanvas(width, height).getContext('2d')!
    context.drawImage(bitmap, left, top, width, height, 0, 0, width, height)
    const { data } = context.getImageData(0, 0, width, height)
    // each channel, from 0 to 1, weighed over the pixel and the eight around it
    const blurred = new Float32Array(width * height * 3)
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        for (let channel = 0; channel < 3; channel++) {
          let [sum, weights] = [0, 0]
          for (let v = Math.max(y - 1, 0); v <= Math.min(y + 1, height - 1); v++)
            for (let u = Math.max(x - 1, 0); u <= Math.min(x + 1, width - 1); u++) {
              const weight = (2 - Math.abs(u - x)) * (2 - Math.abs(v - y))
              sum += weight * data[(v * width + u) * 4 + channel]!
              weights += weight
            }
          blurred[(y * width + x) * 3 + channel] = sum / weights / 255
        }
    return { width, height, blurred }
  }
  type Image = Awaited<ReturnType<typeof decode>>

  const alike = (image: Image, x: number, y: number, by: Image, u: number, v: number) =>
    [0, 1, 2].every(
      (channel) =>
        Math.abs(
          image.blurred[(y * image.width + x) * 3 + channel]! -
            by.blurred[(v * by.width + u) * 3 + channel]!,
        ) <= 0.25,
    )
  const covered = (image: Image, by: Image) => {
    for (let y = 0; y < image.height; y++)
      for (let x = 0; x < image.width; x++) {
        let near = false
        for (let v = Math.max(y - 1, 0); v <= Math.min(y + 1, by.height - 1) && !near; v++)
          for (let u = Math.max(x - 1, 0); u <= Math.min(x + 1, by.width - 1) && !near; u++)
            near = alike(image, x, y, by, u, v)
        if (!near) return false
      }
    return true
  }
  const [one, other] = await Promise.all(images.map(decode))
  if (Math.abs(one!.width - other!.width) > 1 || Math.abs(one!.height - other!.height) > 1)
    return undefined
  return covered(one!, other!) && covered(other!, one!)
}

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

  const colorProperties = [
    'background-color',
    'color',
    'border-color',
    'border-block-end-color',
    'outline-color',
  ]
  const probe = document.createElement('ws-spec-probe')
  const base =
    'position:absolute;display:block;visibility:hidden;pointer-events:none;' +
    'forced-color-adjust:none;border-style:solid;outline-style:solid'
  const read = (element: Element, pseudo: string | undefined, property: string) =>
    getComputedStyle(element, pseudo).getPropertyValue(property).trim()

  // the part, where the example draws it: the first element of its slot that does, such as the
  // checked one of a group's options
  const draws = (element: Element, pseudo: string | undefined) => {
    if (!element.checkVisibility()) return false
    if (pseudo === '::before' || pseudo === '::after')
      return !['none', 'normal'].includes(read(element, pseudo, 'content'))
    if (pseudo === '::placeholder')
      return (
        (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
        !!element.placeholder &&
        !element.value
      )
    return true
  }
  const find = (root: Element, { selector, pseudo }: Target) => {
    const elements = root.matches(selector) ? [root] : [...root.querySelectorAll(selector)]
    return elements.find((element) => draws(element, pseudo))
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
      // the rows that hold: those whose condition the example meets, and of two for the same
      // property of a part, the later
      const holds = measures.map(
        ({ when }) => !when || (find(root, when.target) !== undefined) === when.drawn,
      )
      measures.forEach(({ part, property }, index) => {
        if (
          measures.some(
            (later, at) =>
              at > index && holds[at] && later.part === part && later.property === property,
          )
        )
          holds[index] = false
      })
      // read every part before a probe is in it
      const parts = measures.map(({ target, property }, index) => {
        const element = holds[index] ? find(root, target) : undefined
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
 * outline, in a color that is not the page's. A focus ring has to stay an outline, and a line on
 * one side, such as a separator's, a border on that side: an outline would draw a box.
 */
function edgesInPage(
  edges: { id: string; element: number; part: string; target: Target; edge: Edge }[],
): { id: string; message: string }[] {
  for (const animation of document.getAnimations())
    if ('transitionProperty' in animation) animation.finish()

  const probe = document.createElement('ws-spec-probe')
  probe.style.cssText = 'position:absolute;visibility:hidden;forced-color-adjust:none'
  // where the probe goes: next to the part, but out of a table, where an element among its rows or
  // cells is drawn as one of them, and a table of collapsed borders goes on drawing the borders it
  // drew around it once it is gone
  const home = (near: Element) => {
    let at = near.parentElement
    while (at && getComputedStyle(at).display.includes('table')) at = at.parentElement
    return at ?? document.body
  }
  const seen = (color: string, near: Element) => {
    // the page's color where the part is, as the system paints it there
    home(near).append(probe)
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
  for (const { id, element: which, part, target, edge } of edges) {
    const root = document.querySelectorAll(`[data-spec="${CSS.escape(id)}"]`)[which]
    if (!root) continue
    const { selector } = target
    const elements = root.matches(selector) ? [root] : [...root.querySelectorAll(selector)]
    const element = elements.find((each) => each.checkVisibility())
    if (!element) continue
    const style = getComputedStyle(element, target.pseudo)
    const loses = `${id}: ${part} loses its ${edge} in forced colors: `
    if (edge === 'border-block-end') {
      // a line on one side: that side's border
      if (!line(style, edge, element))
        failures.push({
          id,
          message:
            `${loses}${edge} ` +
            ['width', 'style', 'color']
              .map((property) => style.getPropertyValue(`${edge}-${property}`))
              .join(' '),
        })
      continue
    }
    const outline = line(style, 'outline', element)
    const border = ['top', 'right', 'bottom', 'left'].every((side) =>
      line(style, `border-${side}`, element),
    )
    if (edge === 'outline' ? outline : border || outline) continue
    failures.push({
      id,
      message:
        loses +
        `border ${style.borderWidth} ${style.borderStyle} ${style.borderColor}, ` +
        `outline ${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
    })
  }
  return failures
}
