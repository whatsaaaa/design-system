// Measures the contrast pairs in tokens/contrast.json, and the pairs the names of the component
// tier imply, against the built tokens.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { wcagContrast } from 'culori'
import { inTier } from './tier.ts'
import { type Theme, type TokenId, tokens } from './tokens.ts'

export interface ContrastPair {
  foreground: TokenId
  background: TokenId
  /** The contrast the pair has to reach: 4.5 for text, 3 for large type, outlines and graphics. */
  min: number
  /** What the pair is used for. */
  use: string
  /**
   * The opaque color a translucent background sits on. A translucent background has to name it, as
   * its contrast depends on what lies under it. An opaque one is measured as it is.
   */
  over?: TokenId
  /** Themes in which the pair is known to miss its bar, with how the meaning is carried instead. */
  below?: Partial<Record<Theme, string>>
}

export interface Measured extends ContrastPair {
  theme: Theme
  ratio: number
  passes: boolean
}

interface Rgb {
  r: number
  g: number
  b: number
  alpha: number
}

function rgb(id: TokenId, theme: Theme): Rgb {
  const token = tokens(theme)[id]
  if (token.$type !== 'color') throw new Error(`${id} is not a color`)
  const [r, g, b] = token.$value.components as [number, number, number]
  return { r, g, b, alpha: token.$value.alpha ?? 1 }
}

/** A translucent color as it looks on an opaque one. */
const blend = (top: Rgb, under: Rgb): Rgb => ({
  r: top.r * top.alpha + under.r * (1 - top.alpha),
  g: top.g * top.alpha + under.g * (1 - top.alpha),
  b: top.b * top.alpha + under.b * (1 - top.alpha),
  alpha: 1,
})

export function readPairs(): ContrastPair[] {
  const file = join(resolve(import.meta.dirname, '../..'), 'tokens/contrast.json')
  return JSON.parse(readFileSync(file, 'utf8')).pairs
}

/** The contrast of one pair in one theme, rounded down so a pass is never an artifact of rounding. */
export function measure(pair: ContrastPair, theme: Theme): Measured {
  const fill = rgb(pair.background, theme)
  if (fill.alpha < 1 && !pair.over)
    throw new Error(
      `${pair.foreground} on ${pair.background}: ${pair.background} is translucent in ${theme}, so the pair has to name \`over\`, the opaque color it lies on`,
    )
  const background = blend(fill, rgb(pair.over ?? 'color.bg', theme))
  const foreground = blend(rgb(pair.foreground, theme), background)
  const ratio =
    Math.floor(wcagContrast({ mode: 'rgb', ...foreground }, { mode: 'rgb', ...background }) * 100) /
    100
  return { ...pair, theme, ratio, passes: ratio >= pair.min }
}

/**
 * The states a tier token can name, last in its id: `field.border.hover`. A color without one is
 * the color at rest.
 */
export const tierStates = [
  'rest',
  'hover',
  'active',
  'focus',
  'disabled',
  'checked',
  'indeterminate',
  'invalid',
  'open',
  'selected',
  'current',
  'loading',
] as const

/** The color properties of a tier token: a fill, and what is drawn on it. */
export const tierColors = ['bg', 'text', 'border', 'icon'] as const

/** A color of the tier, read from its id: `<prefix>.<property>.<state>`. */
interface TierColor {
  id: TokenId
  prefix: string
  property: string
  state: string
}

function tierColor(id: TokenId): TierColor {
  const segments = id.split('.')
  const last = segments.at(-1)!
  const stated = (tierStates as readonly string[]).includes(last)
  const property = stated ? segments.at(-2)! : last
  const prefix = segments.slice(0, stated ? -2 : -1).join('.')
  if (!(tierColors as readonly string[]).includes(property))
    throw new Error(`${id} is a color, so it ends in ${tierColors.join(', ')} or a state of one`)
  return { id, prefix, property, state: stated ? last : 'rest' }
}

/** The contrast each color drawn on a fill has to reach: 4.5 for text, 3 for an edge or an icon. */
const drawnMin = new Map([
  ['text', 4.5],
  ['border', 3],
  ['icon', 3],
])

/** The colors of the tier, by id. */
const tierColorIds = (): TokenId[] =>
  (Object.keys(tokens('dark')) as TokenId[]).filter(
    (id) => inTier(id) && tokens('dark')[id].$type === 'color',
  )

/**
 * The pairs the names of the component tier imply, so the tier needs no entries of its own in
 * tokens/contrast.json:
 *
 * - `<prefix>.text.<state>` and `<prefix>.icon.<state>` on `<prefix>.bg.<state>`, else the fill
 *   at rest, else the page: 4.5 for text, 3 for an icon.
 * - `<prefix>.border.<state>` on that fill where there is one, and on the page, as an edge lies
 *   between the two: 3.
 * - A color at rest is also read on the fill of every other state that names no color of its own
 *   for it, as it keeps it there: text at rest on the hover fill, unless there is a text.hover.
 * - Disabled is exempt, as WCAG exempts an inactive control.
 *
 * A pair that tokens/contrast.json lists too is measured as it says there, with its exceptions.
 */
export function tierPairs(ids: TokenId[] = tierColorIds()): ContrastPair[] {
  const colors = ids.map(tierColor)
  const named = (prefix: string, property: string, state: string) =>
    colors.find((one) => one.prefix === prefix && one.property === property && one.state === state)
      ?.id
  const fills = (prefix: string) =>
    colors.filter((one) => one.prefix === prefix && one.property === 'bg')
  const listed = new Set(readPairs().map((pair) => `${pair.foreground} on ${pair.background}`))
  const pairs: ContrastPair[] = []
  const add = (foreground: TokenId, background: TokenId, min: number) => {
    const use = `The component tier: ${foreground} on ${background}`
    if (!listed.has(`${foreground} on ${background}`) && !pairs.some((pair) => pair.use === use))
      pairs.push({ foreground, background, min, use })
  }
  for (const { id, prefix, property, state } of colors) {
    const min = drawnMin.get(property)
    if (state === 'disabled' || min === undefined) continue
    const under = named(prefix, 'bg', state) ?? named(prefix, 'bg', 'rest')
    if (property === 'border' || !under) add(id, 'color.bg', min)
    if (under) add(id, under, min)
    if (state === 'rest')
      for (const other of fills(prefix))
        if (other.state !== 'disabled' && !named(prefix, property, other.state))
          add(id, other.id, min)
  }
  return pairs
}

/** The pairs of tokens/contrast.json, then the pairs of the component tier. */
export const allPairs = (): ContrastPair[] => [...readPairs(), ...tierPairs()]

/** Every pair in both themes. */
export function measureAll(pairs: ContrastPair[] = allPairs()): Measured[] {
  return pairs.flatMap((pair) => (['dark', 'light'] as const).map((theme) => measure(pair, theme)))
}
