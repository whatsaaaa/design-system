/**
 * A component spec as data, and what each example of its gallery is held to, worked out from the
 * spec alone. The parity helper measures a gallery against it, and the design system's own tests
 * and style guide read the specs through it too, so all of them read a spec alike.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolver } from '../../dist/tokens.js'

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface SpecRow {
  /** A kind, a list of kinds, or `*` for every kind the spec covers. */
  variant: string | string[]
  state: string
  part: string
  property: string
  /** Without a size, the row holds at every size. */
  size?: Size
  /** A part the example draws: the row holds only where it does. */
  with?: string
  /** A part the example does not draw: the row holds only where it is missing. */
  without?: string
  token?: string
  value?: string
}

export interface Spec {
  $schema: string
  component: string
  title: string
  status: 'draft' | 'stable'
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
  gallery: string[]
}

/** The published specs, next to this module in the package: `specs/`. */
const specDirectory = new URL('../../specs/', import.meta.url)

/** The names of the published specs, in order: `button`, `input`. */
export const specNames = (): string[] =>
  readdirSync(specDirectory)
    .filter((file) => file.endsWith('.spec.json'))
    .map((file) => file.slice(0, -'.spec.json'.length))
    .sort()

/** A published spec, by its component's name. */
export function loadSpec(name: string): Spec {
  if (!specNames().includes(name))
    throw new Error(`there is no spec named ${name}. The specs are: ${specNames().join(', ')}`)
  return JSON.parse(readFileSync(new URL(`${name}.spec.json`, specDirectory), 'utf8'))
}

/**
 * Where a part is drawn: the element with its `data-slot`, or the one inside an element of
 * another, `[data-slot="base"] [data-slot="leadingIcon"]`, or a pseudo-element of it.
 */
export interface Target {
  selector: string
  pseudo?: string
}

/**
 * What a part can be drawn as: a slot, `base` or `leading-icon`, a slot inside others,
 * `base leadingIcon`, and a pseudo-element of it, `label::after`.
 */
const drawnAs = /^[a-zA-Z][a-zA-Z0-9-]*( [a-zA-Z][a-zA-Z0-9-]*)*(::[a-z-]+)?$/

/**
 * Where each part of the spec is drawn, from an implementation's map of the parts it draws under
 * another name. A part the map does not name is the slot of its own name. A map that names a part
 * the spec does not have, such as a part an update of the spec renamed, is an error.
 */
export function partTargets(
  spec: Spec,
  parts: Record<string, string> = {},
): Record<string, Target> {
  const names = Object.keys(spec.parts)
  const unknown = Object.keys(parts).filter((part) => !names.includes(part))
  if (unknown.length)
    throw new Error(
      `the ${spec.component} spec has no ${unknown.length > 1 ? 'parts' : 'part'} ${unknown.join(', ')}. ` +
        `Its parts are: ${names.join(', ')}`,
    )
  return Object.fromEntries(
    names.map((part) => {
      const as = parts[part] ?? part
      if (!drawnAs.test(as))
        throw new Error(
          `the part ${part} of the ${spec.component} spec cannot be drawn as "${as}": ` +
            'a part map names a slot, a slot and a pseudo-element of it, or a slot inside ' +
            'another, such as base, label::after or base leadingIcon',
        )
      const [path = part, pseudo] = as.split(/(?=::)/)
      const selector = path
        .split(' ')
        .map((slot) => `[data-slot="${slot}"]`)
        .join(' ')
      return [part, pseudo ? { selector, pseudo } : { selector }]
    }),
  )
}

/** The kinds a row holds for. */
export const rowVariants = (spec: Spec, row: SpecRow): string[] =>
  row.variant === '*'
    ? Object.keys(spec.variants)
    : typeof row.variant === 'string'
      ? [row.variant]
      : row.variant

/** The token types by id, from the token data. They are the same in both themes. */
let types: Map<string, string> | undefined
const typeOf = (id: string): string | undefined =>
  (types ??= new Map(
    Object.entries(resolver.apply({ theme: 'dark' })).map(([key, token]) => [key, token.$type]),
  )).get(id)

/** The part a row depends on, and whether the example has to draw it, for a row with a condition. */
export function rowCondition(row: SpecRow): { part: string; drawn: boolean } | undefined {
  if (row.with !== undefined) return { part: row.with, drawn: true }
  if (row.without !== undefined) return { part: row.without, drawn: false }
  return undefined
}

/** A row's condition as a person reads it: `with leading-icon`, or nothing. */
export const describeCondition = (row: SpecRow): string =>
  row.with !== undefined
    ? `with ${row.with}`
    : row.without !== undefined
      ? `without ${row.without}`
      : ''

/**
 * The CSS variable that holds a row's token: `button.primary.bg.rest` is
 * `--ws-button-primary-bg-rest`, and a text style on a font property is that part of it:
 * `text.label` on `font-size` is `--ws-text-label-font-size`.
 */
export function cssVariable(row: SpecRow): string {
  if (row.token === undefined) throw new Error(`a row for ${row.property} has a value, no token`)
  const name = `--ws-${row.token.replaceAll('.', '-')}`
  return typeOf(row.token) === 'typography' ? `${name}-${row.property}` : name
}

/** An example of a gallery, as its id names it: `button.primary.hover`, `button.primary.rest.xs`. */
export interface Example {
  id: string
  variant: string
  state: string
  size: Size
}

/** The example an id names. An id without a size is at the spec's default size. */
export function example(spec: Spec, id: string): Example {
  const [component, variant, state, size] = id.split('.')
  if (component !== spec.component || !variant || !state)
    throw new Error(`${id} is not an example of the ${spec.component} spec`)
  return { id, variant, state, size: (size as Size | undefined) ?? spec.defaultSize }
}

/** One property of one part of an example, and the row of the state table that says it. */
export interface Expectation {
  part: string
  property: string
  row: SpecRow
  /** The row's place in the state table. */
  index: number
}

/**
 * What an example is held to: the rows of its kind and size at rest, and over them the rows of
 * its state, since a state lists what it changes from rest. A row with a condition holds only
 * where the example draws its part, or does not, which only the page tells: where two rows of the
 * same property of a part hold there, the later one in this list does.
 */
export function expectations(spec: Spec, { variant, state, size }: Example): Expectation[] {
  let held: Expectation[] = []
  for (const phase of state === 'rest' ? ['rest'] : ['rest', state])
    spec.stateTable.forEach((row, index) => {
      if (row.state !== phase || (row.size && row.size !== size)) return
      if (!rowVariants(spec, row).includes(variant)) return
      // a row takes the place of those with its condition, or of all of them without one
      held = held.filter(
        (one) =>
          one.part !== row.part ||
          one.property !== row.property ||
          (describeCondition(row) !== '' && describeCondition(one.row) !== describeCondition(row)),
      )
      held.push({ part: row.part, property: row.property, row, index })
    })
  return held
}

/**
 * A row as a person reads it: `primary hover root background-color`, `at xs` for a size and
 * `with leading-icon` for a condition.
 */
export const describeRow = (row: SpecRow): string =>
  [
    [row.variant].flat().join(', '),
    row.state,
    row.part,
    row.property,
    row.size && `at ${row.size}`,
    describeCondition(row),
  ]
    .filter(Boolean)
    .join(' ')
