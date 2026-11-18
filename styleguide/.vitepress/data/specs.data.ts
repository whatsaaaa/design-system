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
  describeCondition,
  rowTokens,
  rowVariants,
  specs,
  tokenOfVariable,
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
  /** The tokens the value reads by their variables, as in `calc(var(--ws-space-12) + …)`. */
  valueTokens?: string[]
  /** The value with each token by its id: `space.12 + control.gap.md`. */
  formula?: string
  dark: CellValue
  light: CellValue
}

export interface StateRow {
  state: string
  part: string
  property: string
  /** Where it holds, when not in every example: `with leading-icon`. */
  condition?: string
  /** The kinds it holds for, when it is not every kind. */
  variants?: string[]
  cell: Cell
}

export interface SizeRow {
  /** The parts and properties that take the same token at every size, and where they hold. */
  targets: { part: string; property: string; condition?: string }[]
  state: string
  variants?: string[]
  /** The token at every size, where it is one name with the size last: `control.height.<size>`. */
  pattern?: string
  /**
   * For a sum of tokens, the terms the same at every size or that follow that pattern,
   * `control.gap.<size>`, which the row names once, added or taken away, and each size's own
   * others, which its cell names.
   */
  sum?: { plus: string[]; less: string[]; own: Partial<Record<Size, string[]>> }
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

/** A value with each variable of a token in its place: `var(--ws-space-12)` as `space.12` or 12px. */
const withTokens = (value: string, read: (token: TokenId) => string) =>
  value.replace(/var\((--[a-z0-9-]+)\)/g, (variable, name: string) => {
    const token = tokenOfVariable(name)
    return token ? read(token) : variable
  })

/** A color with some of its alpha: `color-mix(in srgb, X 80%, transparent)` is X at 80%. */
const tintOf = (value: string): { color: string; percent: number } | undefined => {
  const match = /^color-mix\(in srgb, (\S+) (\d+(?:\.\d+)?)%, transparent\)$/.exec(value)
  return match ? { color: match[1]!, percent: Number(match[2]) } : undefined
}

/** A value with its tokens by their ids: `space.12 + control.gap.md`, `color.bg at 80%`. */
function formulaOf(value: string): string {
  const tint = tintOf(value)
  return tint ? `${tint.color} at ${tint.percent}%` : value.replace(/^calc\((.+)\)$/, '$1')
}

/** What a sum of lengths comes to, as `12px - (2px - 1px)` comes to 11, or nothing for another value. */
function total(expression: string): number | undefined {
  const parts = expression.match(/\d+(?:\.\d+)?px|[-+()]|\S+/g) ?? []
  let at = 0
  const term = (): number | undefined => {
    const part = parts[at++]
    if (part !== '(') return part && part.endsWith('px') ? parseFloat(part) : undefined
    const inner = sum()
    return parts[at++] === ')' ? inner : undefined
  }
  const sum = (): number | undefined => {
    let result = term()
    while (result !== undefined && (parts[at] === '+' || parts[at] === '-')) {
      const sign = parts[at++] === '+' ? 1 : -1
      const next = term()
      result = next === undefined ? undefined : result + sign * next
    }
    return result
  }
  const result = sum()
  return at === parts.length ? result : undefined
}

/**
 * What a value gives a property, in one theme: each token it reads in place of its variable, and
 * a sum of lengths as its total, so `calc(var(--ws-space-12) + var(--ws-control-gap-md))` is 20px.
 */
function valueText(row: SpecRow, theme: Theme): CellValue {
  const text = withTokens(row.value!, (token) => tokenValue({ ...row, token }, theme).text)
  // a tint of a color, as a tint token shows: #191724 at 80%
  const tint = tintOf(text)
  if (tint) {
    const alpha = Math.round((tint.percent / 100) * 255)
    return {
      text: `${tint.color} at ${tint.percent}%`,
      color: `${tint.color}${alpha.toString(16).padStart(2, '0')}`,
    }
  }
  const body = /^calc\((.+)\)$/.exec(text)?.[1]
  const length = body === undefined ? undefined : total(body)
  return { text: length === undefined ? text : `${length}px` }
}

/**
 * The terms of a calc, each with its sign and with its tokens by their ids:
 * `calc(var(--ws-space-12) - (var(--ws-a) - var(--ws-b)))` is `space.12` and less `(a - b)`.
 */
function calcTerms(value: string): { sign: 1 | -1; term: string }[] | undefined {
  const body = /^calc\((.+)\)$/.exec(withTokens(value, (token) => token))?.[1]
  if (body === undefined) return undefined
  const terms: { sign: 1 | -1; term: string }[] = []
  let [depth, start, sign] = [0, 0, 1 as 1 | -1]
  for (let at = 0; at < body.length; at++) {
    if (body[at] === '(') depth++
    else if (body[at] === ')') depth--
    else if (depth === 0 && /^ [-+] $/.test(body.slice(at, at + 3))) {
      terms.push({ sign, term: body.slice(start, at) })
      sign = body[at + 1] === '+' ? 1 : -1
      start = at + 3
      at += 2
    }
  }
  return [...terms, { sign, term: body.slice(start) }]
}

function cell(row: SpecRow): Cell {
  if (row.token === undefined) {
    const valueTokens = rowTokens(row)
    return {
      value: row.value,
      ...(valueTokens.length > 0 && {
        valueTokens,
        formula: formulaOf(withTokens(row.value!, (token) => token)),
      }),
      dark: valueText(row, 'dark'),
      light: valueText(row, 'light'),
    }
  }
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
  const conditionOf = (row: SpecRow) => describeCondition(row) || undefined

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
    condition: conditionOf(row),
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
    const condition = conditionOf(row)
    let target = bySize.find(
      ({ targets: [first], state, variants: theirs }) =>
        first!.part === row.part &&
        first!.property === row.property &&
        first!.condition === condition &&
        state === row.state &&
        String(theirs) === String(variants),
    )
    if (!target) {
      target = {
        targets: [{ part: row.part, property: row.property, condition }],
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
  // a token named for each size, `control.height.xs` to `.xl`, as `control.height.<size>`
  const patternOf = (tokens: [string, string | undefined][]) => {
    const prefix = tokens[0]![1]?.replace(/\.[a-z]+$/, '')
    return prefix && tokens.every(([size, token]) => token === `${prefix}.${size}`)
      ? `${prefix}.<size>`
      : undefined
  }
  for (const row of sizeRows) {
    const cells = Object.entries(row.cells)
    row.pattern = patternOf(cells.map(([size, value]) => [size, value.token]))
    const terms = cells.map(([, value]) => (value.value ? calcTerms(value.value) : undefined))
    const first = terms[0]
    if (!first || terms.some((each) => each?.length !== first.length)) continue
    // a term the same at every size, or that follows the size, with its sign at every size
    const shared = first.map(({ sign, term }, at) => {
      const each = terms.map((all) => all![at]!)
      if (each.some((one) => one.sign !== sign)) return undefined
      if (each.every((one) => one.term === term)) return term
      return patternOf(cells.map(([size], which) => [size, each[which]!.term]))
    })
    const own = terms.map((all) => all!.filter((_, at) => shared[at] === undefined))
    // each size's own terms are added, which its cell names
    if (!shared.some(Boolean) || own.some((all) => all.some(({ sign }) => sign < 0))) continue
    const signed = (sign: number) =>
      shared.filter((term, at) => term !== undefined && first[at]!.sign === sign) as string[]
    row.sum = {
      plus: signed(1),
      less: signed(-1),
      own: Object.fromEntries(
        cells.map(([size], which) => [size, own[which]!.map(({ term }) => term)]),
      ),
    }
  }

  // the measured pairs whose colors the table names, on a color it names or on the page
  const named = new Set(stateTable.flatMap(rowTokens))
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
