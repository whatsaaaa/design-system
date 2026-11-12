// Measures the contrast pairs in tokens/contrast.json against the built tokens.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { wcagContrast } from 'culori'
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

/** Every pair in both themes. */
export function measureAll(): Measured[] {
  return readPairs().flatMap((pair) =>
    (['dark', 'light'] as const).map((theme) => measure(pair, theme)),
  )
}
