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
  /** The opaque color a translucent background sits on. Defaults to the page background. */
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
  const under = rgb(pair.over ?? 'color.bg', theme)
  const background = blend(rgb(pair.background, theme), under)
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
  return { id, prefix, property, state: stated ? last : 'rest' }
}

/**
 * The pairs the names of the component tier imply, so the tier needs no entries of its own in
 * tokens/contrast.json:
 *
 * - `<prefix>.text.<state>` on `<prefix>.bg.<state>`, else the fill at rest, else the page: 4.5.
 *   Text at rest is also read on every other fill of its prefix, which it keeps on hover: 4.5.
 * - `<prefix>.border.<state>` and `<prefix>.icon.<state>` on the page, and on the fill of their
 *   prefix where there is one: 3.
 * - Disabled is exempt, as WCAG exempts an inactive control.
 *
 * A pair that tokens/contrast.json lists too is measured as it says there, with its exceptions.
 */
export function tierPairs(): ContrastPair[] {
  const colors = (Object.keys(tokens('dark')) as TokenId[])
    .filter((id) => inTier(id) && tokens('dark')[id].$type === 'color')
    .map(tierColor)
  const fill = (prefix: string, state: string) =>
    colors.find((one) => one.prefix === prefix && one.property === 'bg' && one.state === state)?.id
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
    if (state === 'disabled') continue
    if (property === 'text') {
      add(id, fill(prefix, state) ?? fill(prefix, 'rest') ?? 'color.bg', 4.5)
      if (state === 'rest')
        for (const other of fills(prefix)) if (other.state !== 'disabled') add(id, other.id, 4.5)
    } else if (property === 'border' || property === 'icon') {
      add(id, 'color.bg', 3)
      const under = fill(prefix, state) ?? fill(prefix, 'rest')
      if (under) add(id, under, 3)
    }
  }
  return pairs
}

/** The pairs of tokens/contrast.json, then the pairs of the component tier. */
export const allPairs = (): ContrastPair[] => [...readPairs(), ...tierPairs()]

/** Every pair in both themes. */
export function measureAll(pairs: ContrastPair[] = allPairs()): Measured[] {
  return pairs.flatMap((pair) => (['dark', 'light'] as const).map((theme) => measure(pair, theme)))
}
