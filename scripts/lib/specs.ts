// The component specs: specs/<component>.spec.json, validated by specs/spec.schema.json. The tests
// check them against the tokens and the style guide renders its component pages from them, both
// through this module, so the two read a spec alike.
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { type TokenId, tokens } from './tokens.ts'

export const specDirectory = resolve(import.meta.dirname, '../../specs')

/** The spec files, by name, in order. */
export const specFiles = readdirSync(specDirectory)
  .filter((file) => file.endsWith('.spec.json'))
  .sort()

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface SpecRow {
  /** A kind, a list of kinds, or `*` for every kind the spec covers. */
  variant: string | string[]
  state: string
  part: string
  property: string
  /** Without a size, the row holds at every size. */
  size?: Size
  token?: string
  value?: string
}

export interface Implementation {
  library: string
  status: 'planned' | 'shipped'
  parity: 'none' | 'passing' | 'failing'
  components?: string[]
  today?: string
  parts?: Record<string, string>
  variants?: Record<string, Record<string, string | boolean>>
  sizes?: Record<string, Record<string, string | boolean>>
  deviations?: { summary: string; issue?: string }[]
  beyond?: string[]
}

export interface Spec {
  $schema: string
  component: string
  title: string
  status: 'draft' | 'stable'
  changed: string
  summary: string
  use: string[]
  notFor: string[]
  parts: Record<string, string>
  variants: Record<string, string>
  sizes: Partial<Record<Size, string>>
  defaultSize: Size
  states: Record<string, string>
  icons?: Record<string, string>
  stateTable: SpecRow[]
  keyboard: { keys: string[]; effect: string }[]
  aria: { pattern: string; rules: string[] }
  forcedColors: string[]
  motion: string[]
  content: string[]
  notes?: string[]
  implementations: Record<string, Implementation>
  gallery: string[]
}

export const readSpec = (file: string): Spec =>
  JSON.parse(readFileSync(join(specDirectory, file), 'utf8'))

/** Every spec, by its component's name. */
export const specs = (): Spec[] => specFiles.map(readSpec)

/** The kinds a row holds for. */
export const rowVariants = (spec: Spec, row: SpecRow): string[] =>
  row.variant === '*'
    ? Object.keys(spec.variants)
    : typeof row.variant === 'string'
      ? [row.variant]
      : row.variant

/** The font properties a text style gives a part of: `text.label` on `font-size`. */
const textStyleParts: Record<string, string> = {
  'font-family': 'font-family',
  'font-size': 'font-size',
  'font-weight': 'font-weight',
  'line-height': 'line-height',
}

/** The token types each property can take. A text style gives its part of a font property. */
const propertyTypes: Record<string, string[]> = {
  'background-color': ['color'],
  color: ['color'],
  'border-color': ['color'],
  'outline-color': ['color'],
  'border-width': ['dimension'],
  'border-radius': ['dimension'],
  'outline-width': ['dimension'],
  'outline-offset': ['dimension'],
  height: ['dimension'],
  width: ['dimension'],
  'padding-inline': ['dimension'],
  'column-gap': ['dimension'],
  'text-decoration-thickness': ['dimension'],
  'text-underline-offset': ['dimension'],
  'font-family': ['fontFamily', 'typography'],
  'font-size': ['dimension', 'typography'],
  'font-weight': ['fontWeight', 'typography'],
  'line-height': ['number', 'typography'],
}

/** Why a row's token cannot be read for its property, or nothing when it can. */
export function tokenProblem(row: SpecRow): string | undefined {
  if (row.token === undefined) return undefined
  const token = tokens('dark')[row.token as TokenId]
  if (!token) return `${row.token} is not a token`
  const types = propertyTypes[row.property]
  if (!types) return `${row.property} takes a value, not a token`
  if (!types.includes(token.$type))
    return `${row.token} is a ${token.$type}, and ${row.property} takes a ${types.join(' or ')}`
  return undefined
}

/**
 * The CSS variable that holds a row's token: `button.primary.bg.rest` is
 * `--ws-button-primary-bg-rest`, and a text style on a font property is that part of it.
 */
export function cssVariable(row: SpecRow): string {
  if (row.token === undefined) throw new Error(`a row for ${row.property} has a value, no token`)
  const name = `--ws-${row.token.replaceAll('.', '-')}`
  const typography = tokens('dark')[row.token as TokenId]?.$type === 'typography'
  return typography ? `${name}-${textStyleParts[row.property]}` : name
}

/** Every token the specs read. */
export const tokensRead = (all: Spec[] = specs()): Set<string> =>
  new Set(all.flatMap((spec) => spec.stateTable.flatMap((row) => (row.token ? [row.token] : []))))
