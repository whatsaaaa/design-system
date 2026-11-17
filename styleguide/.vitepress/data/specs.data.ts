// The component specs as their pages show them, read at build time from specs/ and the built
// tokens: each row of a state table with its token's value in both themes, and the contrast of
// the colors it names. So a page cannot disagree with its spec.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { allPairs } from '../../../scripts/lib/contrast.ts'
import {
  type Size,
  type Spec,
  type SpecRow,
  cssVariable,
  rowVariants,
  specs,
} from '../../../scripts/lib/specs.ts'
import { inTier, tierDirectory, tierFiles } from '../../../scripts/lib/tier.ts'
import { type Theme, type TokenId, tokens } from '../../../scripts/lib/tokens.ts'
import { colorHex } from '../../../src/color.ts'
import { type ContrastRow, contrastRows } from './contrast.ts'

export type { ContrastRow }

/** What a row gives its property in one theme. */
export interface CellValue {
  text: string
  /** The color, `#rrggbb` or `#rrggbbaa`, for a color. */
  color?: string
}

/** A row's token, or its value, and what that is in each theme. */
export interface Cell {
  /** The token's id, or nothing for a value the system writes without a token. */
  token?: string
  /** Its CSS variable. */
  cssVar?: string
  /** The token a tier token aliases. */
  aliasOf?: string
  /** The value written without a token. */
  value?: string
  dark: CellValue
  light: CellValue
}

export interface StateRow {
  state: string
  part: string
  property: string
  /** The kinds it holds for, when it is not every kind. */
  variants?: string[]
  cell: Cell
}

export interface SizeRow {
  /** The parts and properties that take the same token at every size. */
  targets: { part: string; property: string }[]
  state: string
  variants?: string[]
  /** The token at every size, where it is one name with the size last: `control.height.<size>`. */
  pattern?: string
  cells: Partial<Record<Size, Cell>>
}

export interface SpecPage extends Omit<Spec, 'stateTable'> {
  /** The rows that hold at every size: those for every kind first, then each kind's own. */
  stateGroups: { variant: string | null; rows: StateRow[] }[]
  /** The rows that differ by size, a row of the matrix for each part and property. */
  sizeRows: SizeRow[]
  contrast: ContrastRow[]
}

declare const data: Record<string, SpecPage>
export { data }

/** The token a tier token aliases, from its source: `button.primary.bg.rest` is `color.interactive`. */
const tierAliases: Record<string, string> = {}
for (const file of tierFiles) {
  const walk = (node: Record<string, unknown>, path: string[]) => {
    if (typeof node.$value === 'string') tierAliases[path.join('.')] = node.$value.slice(1, -1)
    else
      for (const [key, child] of Object.entries(node))
        if (!key.startsWith('$') && typeof child === 'object')
          walk(child as Record<string, unknown>, [...path, key])
  }
  walk(JSON.parse(readFileSync(join(tierDirectory, file), 'utf8')), [])
}

const dimension = ({ value, unit }: { value: number; unit: string }) =>
  unit === 'rem' ? `${value * 16}px` : `${value}${unit}`

/** What a token gives a property, in one theme. */
function tokenValue(row: SpecRow, theme: Theme): CellValue {
  const token = tokens(theme)[row.token as TokenId]
  const value = token.$value as unknown
  switch (token.$type) {
    case 'color': {
      const hex = colorHex(token.$value)
      // a tint as its color and how much of it: #eb6f92 at 9%
      const alpha = token.$value.alpha ?? 1
      const text = alpha < 1 ? `${hex.slice(0, 7)} at ${Math.round(alpha * 100)}%` : hex
      return { text, color: hex }
    }
    case 'dimension':
      return { text: dimension(value as { value: number; unit: string }) }
    case 'fontFamily':
      return { text: (value as string[])[0]! }
    case 'typography': {
      const style = value as {
        fontFamily: string[]
        fontSize: { value: number; unit: string }
        fontWeight: number
        lineHeight: number
      }
      const part: Record<string, string> = {
        'font-family': style.fontFamily[0]!,
        'font-size': dimension(style.fontSize),
        'font-weight': String(style.fontWeight),
        'line-height': String(style.lineHeight),
      }
      return { text: part[row.property]! }
    }
    default:
      return { text: String(value) }
  }
}

function cell(row: SpecRow): Cell {
  if (row.token === undefined)
    return { value: row.value, dark: { text: row.value! }, light: { text: row.value! } }
  return {
    token: row.token,
    cssVar: cssVariable(row),
    aliasOf: tierAliases[row.token],
    dark: tokenValue(row, 'dark'),
    light: tokenValue(row, 'light'),
  }
}

function page(spec: Spec): SpecPage {
  const { stateTable, ...rest } = spec
  const kinds = Object.keys(spec.variants)
  const order = (list: Record<string, string>, key: string) => Object.keys(list).indexOf(key)
  const variantsOf = (row: SpecRow) => (row.variant === '*' ? undefined : rowVariants(spec, row))

  const unsized = stateTable
    .filter((row) => !row.size)
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        order(spec.states, a.row.state) - order(spec.states, b.row.state) ||
        order(spec.parts, a.row.part) - order(spec.parts, b.row.part) ||
        a.index - b.index,
    )
    .map(({ row }) => row)
  const stateRow = (row: SpecRow): StateRow => ({
    state: row.state,
    part: row.part,
    property: row.property,
    variants: variantsOf(row),
    cell: cell(row),
  })
  const stateGroups = [
    { variant: null, rows: unsized.filter((row) => row.variant === '*').map(stateRow) },
    ...kinds.map((variant) => ({
      variant,
      rows: unsized
        .filter((row) => row.variant !== '*' && rowVariants(spec, row).includes(variant))
        .map(stateRow),
    })),
  ].filter((group) => group.rows.length > 0)

  // a row of the matrix for each part and property in a state, then one for those that take
  // the same tokens in it, such as the width and the height of both icons
  const bySize: SizeRow[] = []
  for (const row of stateTable.filter((row) => row.size)) {
    const variants = variantsOf(row)
    let target = bySize.find(
      ({ targets: [first], state, variants: theirs }) =>
        first!.part === row.part &&
        first!.property === row.property &&
        state === row.state &&
        String(theirs) === String(variants),
    )
    if (!target) {
      target = {
        targets: [{ part: row.part, property: row.property }],
        state: row.state,
        variants,
        cells: {},
      }
      bySize.push(target)
    }
    const value = cell(row)
    // a measure is the same in both themes, which the matrix shows once
    if (value.dark.text !== value.light.text)
      throw new Error(`${spec.component}: ${row.token} differs by theme, and a size row shows one`)
    if (target.cells[row.size!])
      throw new Error(`${spec.component}: ${JSON.stringify(row)} is a second row for its size`)
    target.cells[row.size!] = value
  }
  const sameTokens = (a: SizeRow, b: SizeRow) =>
    a.state === b.state &&
    String(a.variants) === String(b.variants) &&
    JSON.stringify(
      Object.entries(a.cells).map(([size, value]) => [size, value.token ?? value.value]),
    ) ===
      JSON.stringify(
        Object.entries(b.cells).map(([size, value]) => [size, value.token ?? value.value]),
      )
  const sizeRows: SizeRow[] = []
  for (const row of bySize) {
    const same = sizeRows.find((entry) => sameTokens(entry, row))
    if (same) same.targets.push(...row.targets)
    else sizeRows.push(row)
  }
  for (const row of sizeRows) {
    const tokens = Object.entries(row.cells).map(([size, value]) => [size, value.token])
    const prefix = tokens[0]![1]?.replace(/\.[a-z]+$/, '')
    if (prefix && tokens.every(([size, token]) => token === `${prefix}.${size}`))
      row.pattern = `${prefix}.<size>`
  }

  // the measured pairs whose colors the table names, on a color it names or on the page
  const named = new Set(stateTable.flatMap((row) => (row.token ? [row.token] : [])))
  const contrast = contrastRows(
    allPairs()
      .filter(
        (pair) =>
          named.has(pair.foreground) &&
          (named.has(pair.background) || pair.background === 'color.bg'),
      )
      // a pair of the tier says no more than its names
      .map((pair) => (inTier(pair.foreground) ? { ...pair, use: '' } : pair)),
  )

  return { ...rest, stateGroups, sizeRows, contrast }
}

export default {
  watch: ['../../../specs/*.json', '../../../tokens/**/*.json', '../../../dist/tokens.js'],
  load(): Record<string, SpecPage> {
    return Object.fromEntries(specs().map((spec) => [spec.component, page(spec)]))
  },
}
