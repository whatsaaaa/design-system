// The component specs: specs/<component>.spec.json, validated by specs/spec.schema.json. The tests
// check them against the tokens and the style guide renders its component pages from them, both
// through this module, so the two read a spec alike.
import { resolve } from 'node:path'
import { type Spec, type SpecRow, loadSpec, specNames } from '../../src/testing/spec.ts'
import { type TokenId, tokens } from './tokens.ts'

// the types, and the reading of a spec and of its rows, are the parity helper's, which
// implementations run
export type { Implementation, Size, Spec, SpecRow } from '../../src/testing/spec.ts'
export {
  cssVariable,
  describeCondition,
  rowCondition,
  rowVariants,
} from '../../src/testing/spec.ts'

export const specDirectory = resolve(import.meta.dirname, '../../specs')

/** The spec files, by name, in order. */
export const specFiles = specNames().map((name) => `${name}.spec.json`)

/** Every spec, by its component's name. */
export const specs = (): Spec[] => specNames().map(loadSpec)

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
  'padding-inline-start': ['dimension'],
  'padding-inline-end': ['dimension'],
  'column-gap': ['dimension'],
  'text-decoration-thickness': ['dimension'],
  'text-underline-offset': ['dimension'],
  'font-family': ['fontFamily', 'typography'],
  'font-size': ['dimension', 'typography'],
  'font-weight': ['fontWeight', 'typography'],
  'line-height': ['number', 'typography'],
}

/** The variables a value reads, by name: `calc(var(--ws-space-12) + …)` reads `--ws-space-12`. */
const valueVariables = (value: string): string[] =>
  [...value.matchAll(/var\((--[a-z0-9-]+)\)/g)].map(([, name]) => name!)

/** The token whose variable a name is: `--ws-space-12` is `space.12`. */
let byVariable: Map<string, TokenId> | undefined
export const tokenOfVariable = (name: string): TokenId | undefined =>
  (byVariable ??= new Map(
    (Object.keys(tokens('dark')) as TokenId[]).map((id) => [`--ws-${id.replaceAll('.', '-')}`, id]),
  )).get(name)

/** The tokens a row reads: its token, or those its value reads by their variables. */
export const rowTokens = (row: SpecRow): string[] =>
  row.token !== undefined
    ? [row.token]
    : valueVariables(row.value!).flatMap((name) => tokenOfVariable(name) ?? [])

/** Why a row's token cannot be read for its property, or nothing when it can. */
export function tokenProblem(row: SpecRow): string | undefined {
  if (row.token === undefined) {
    // a value reads only tokens, each of a type its property can take
    for (const name of valueVariables(row.value!)) {
      const id = tokenOfVariable(name)
      if (!id) return `${name}, in ${row.value}, is not a token's variable`
      const problem = tokenProblem({ ...row, token: id, value: undefined })
      if (problem) return problem
    }
    return undefined
  }
  const token = tokens('dark')[row.token as TokenId]
  if (!token) return `${row.token} is not a token`
  const types = propertyTypes[row.property]
  if (!types) return `${row.property} takes a value, not a token`
  if (!types.includes(token.$type))
    return `${row.token} is a ${token.$type}, and ${row.property} takes a ${types.join(' or ')}`
  return undefined
}

/** Every token the specs read. */
export const tokensRead = (all: Spec[] = specs()): Set<string> =>
  new Set(all.flatMap((spec) => spec.stateTable.flatMap(rowTokens)))
