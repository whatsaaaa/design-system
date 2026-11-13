// Everything the style guide shows about the tokens, read at build time from the token
// sources and the built tokens, so the guide cannot drift from the system.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { type Measured, measureAll } from '../../../scripts/lib/contrast.ts'
import { type Theme, type TokenId, tokens } from '../../../scripts/lib/tokens.ts'
import { colorHex } from '../../../src/color.ts'

const root = resolve(import.meta.dirname, '../../..')
const source = (file: string) => JSON.parse(readFileSync(join(root, 'tokens', file), 'utf8'))

export interface Swatch {
  name: string
  hex: string
  cssVar: string
}

export interface ColorValue {
  /** `#rrggbb`, or `#rrggbbaa` for a translucent color. */
  hex: string
  /** The palette color the role points at, or nothing for a value of its own. */
  from?: string
}

export interface ColorRole {
  id: string
  cssVar: string
  description: string
  dark: ColorValue
  light: ColorValue
}

export interface ContrastRow {
  foreground: string
  background: string
  use: string
  min: number
  /** The opaque color a translucent background sits on, when that is not the page background. */
  over?: string
  dark: { ratio: number; passes: boolean; note?: string }
  light: { ratio: number; passes: boolean; note?: string }
}

export interface TextStyle {
  id: string
  cssVar: string
  description: string
  family: 'mono' | 'sans'
  size: string
  weight: number
  lineHeight: number
  tracking: string
}

export interface Scalar {
  id: string
  cssVar: string
  value: string
  description: string
}

export interface SystemData {
  palette: Record<'main' | 'dawn', Swatch[]>
  roles: ColorRole[]
  fixed: ColorRole[]
  contrast: ContrastRow[]
  text: TextStyle[]
  fontSizes: Scalar[]
  space: Scalar[]
  radius: Scalar[]
  borderWidth: Scalar[]
  size: Scalar[]
  duration: Scalar[]
  easing: Scalar[]
}

declare const data: SystemData
export { data }

const cssVar = (id: string) => `--ws-${id.replaceAll('.', '-')}`
function colorValue(id: string, theme: Theme, sources: Record<string, unknown>): ColorValue {
  const token = tokens(theme)[id as TokenId]
  if (token.$type !== 'color') throw new Error(`${id} is not a color`)
  const hex = colorHex(token.$value)
  // the source says which palette color a role points at
  const raw = id
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], sources)
  const reference = (raw as { $value?: unknown } | undefined)?.$value
  const from =
    typeof reference === 'string' ? reference.replace(/^\{palette\.(.+)\}$/, '$1') : undefined
  return from ? { hex, from } : { hex }
}

const dimension = (value: { value: number; unit: string }) => `${value.value}${value.unit}`

export default {
  watch: ['../../../tokens/*.json', '../../../dist/tokens.js'],
  load(): SystemData {
    const dark = tokens('dark')
    const themeSources = {
      dark: source('theme-dark.tokens.json'),
      light: source('theme-light.tokens.json'),
    }
    const core = source('core.tokens.json')
    const ids = Object.keys(dark) as TokenId[]
    const description = (id: TokenId) => dark[id].$description ?? ''

    const role = (id: TokenId, sources: Record<Theme, Record<string, unknown>>): ColorRole => ({
      id,
      cssVar: cssVar(id),
      description: description(id),
      dark: colorValue(id, 'dark', sources.dark),
      light: colorValue(id, 'light', sources.light),
    })

    const scalars = (prefix: string, format: (id: TokenId) => string): Scalar[] =>
      ids
        .filter((id) => id.startsWith(prefix))
        .map((id) => ({ id, cssVar: cssVar(id), value: format(id), description: description(id) }))
    const dimensions = (prefix: string) =>
      scalars(prefix, (id) => dimension(dark[id].$value as { value: number; unit: string })).sort(
        (a, b) =>
          parseFloat(a.value) * (a.value.endsWith('rem') ? 16 : 1) -
          parseFloat(b.value) * (b.value.endsWith('rem') ? 16 : 1),
      )

    const measured = measureAll()
    const contrast: ContrastRow[] = []
    for (const pair of measured.filter((entry) => entry.theme === 'dark')) {
      const of = (theme: Theme) => {
        const entry = measured.find(
          (candidate: Measured) =>
            candidate.theme === theme &&
            candidate.foreground === pair.foreground &&
            candidate.background === pair.background,
        )!
        return { ratio: entry.ratio, passes: entry.passes, note: entry.below?.[theme] }
      }
      contrast.push({
        foreground: pair.foreground,
        background: pair.background,
        use: pair.use,
        min: pair.min,
        over: pair.over,
        dark: of('dark'),
        light: of('light'),
      })
    }

    return {
      palette: {
        main: ids
          .filter((id) => id.startsWith('palette.main.'))
          .map((id) => ({
            name: id.split('.')[2]!,
            hex: colorValue(id, 'dark', {}).hex,
            cssVar: cssVar(id),
          })),
        dawn: ids
          .filter((id) => id.startsWith('palette.dawn.'))
          .map((id) => ({
            name: id.split('.')[2]!,
            hex: colorValue(id, 'dark', {}).hex,
            cssVar: cssVar(id),
          })),
      },
      // in the order of the source file, which goes from surfaces to text to accents to status
      roles: Object.keys(themeSources.dark.color)
        .filter((key) => !key.startsWith('$'))
        .map((key) => role(`color.${key}` as TokenId, themeSources)),
      fixed: ids
        .filter((id) => /^(mark|code|syntax)\./.test(id))
        .map((id) => role(id, { dark: core, light: core })),
      contrast,
      text: ids
        .filter((id) => id.startsWith('text.'))
        .map((id) => {
          const value = dark[id].$value as {
            fontFamily: string[]
            fontSize: { value: number; unit: string }
            fontWeight: number
            lineHeight: number
            letterSpacing: { value: number; unit: string }
          }
          return {
            id,
            cssVar: cssVar(id),
            description: description(id),
            family: value.fontFamily[0] === 'Inter' ? ('sans' as const) : ('mono' as const),
            size: dimension(value.fontSize),
            weight: value.fontWeight,
            lineHeight: value.lineHeight,
            tracking: dimension(value.letterSpacing),
          }
        })
        .sort((a, b) => parseFloat(b.size) - parseFloat(a.size)),
      fontSizes: dimensions('font.size.'),
      space: dimensions('space.'),
      radius: dimensions('radius.'),
      borderWidth: dimensions('border-width.'),
      size: dimensions('size.'),
      duration: dimensions('motion.duration.'),
      easing: scalars(
        'motion.easing.',
        (id) => `cubic-bezier(${(dark[id].$value as number[]).join(', ')})`,
      ),
    }
  },
}
