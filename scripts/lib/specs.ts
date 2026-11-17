// The component specs: specs/<component>.spec.json, validated by specs/spec.schema.json. The tests
// check them against the tokens and the style guide renders its component pages from them, both
// through this module, so the two read a spec alike.
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Spec, SpecRow } from '../../src/testing/spec.ts'
import { type TokenId, tokens } from './tokens.ts'

// the types and the reading of a row are the parity helper's, which implementations run
export type { Implementation, Size, Spec, SpecRow } from '../../src/testing/spec.ts'
export { cssVariable, rowVariants } from '../../src/testing/spec.ts'

export const specDirectory = resolve(import.meta.dirname, '../../specs')

/** The spec files, by name, in order. */
export const specFiles = readdirSync(specDirectory)
  .filter((file) => file.endsWith('.spec.json'))
  .sort()

export const readSpec = (file: string): Spec =>
  JSON.parse(readFileSync(join(specDirectory, file), 'utf8'))

/** Every spec, by its component's name. */
export const specs = (): Spec[] => specFiles.map(readSpec)

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

/** Every token the specs read. */
export const tokensRead = (all: Spec[] = specs()): Set<string> =>
  new Set(all.flatMap((spec) => spec.stateTable.flatMap((row) => (row.token ? [row.token] : []))))
