import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Ajv2020 } from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'
import { tierStates } from '../scripts/lib/contrast.ts'
import {
  type Spec,
  cssVariable,
  rowVariants,
  specDirectory,
  specFiles,
  specs,
  tokenProblem,
  tokensRead,
} from '../scripts/lib/specs.ts'
import { inTier } from '../scripts/lib/tier.ts'
import { type TokenId, tokens } from '../scripts/lib/tokens.ts'

const schema = JSON.parse(readFileSync(join(specDirectory, 'spec.schema.json'), 'utf8'))
const validate = new Ajv2020({ allErrors: true }).compile(schema)
const all = specs()
const ids = Object.keys(tokens('dark')) as TokenId[]

/** Every row of a spec once for each kind it holds for. */
const expanded = (spec: Spec) =>
  spec.stateTable.flatMap((row) => rowVariants(spec, row).map((variant) => ({ ...row, variant })))

describe('the spec schema', () => {
  it('names the states of the component tier, so a spec and a tier token share one list', () => {
    expect(schema.$defs.state.enum).toEqual([...tierStates])
  })

  it('rejects a spec that names a state outside the list, or a property it does not know', () => {
    const [spec] = all
    const row = { variant: '*', part: 'root', property: 'color', token: 'color.text' }
    expect(validate({ ...spec, stateTable: [{ ...row, state: 'pressed' }] })).toBe(false)
    expect(validate({ ...spec, stateTable: [{ ...row, state: 'rest', property: 'colour' }] })).toBe(
      false,
    )
    // a row takes a token or a value, not both
    expect(validate({ ...spec, stateTable: [{ ...row, state: 'rest', value: 'red' }] })).toBe(false)
    expect(validate({ ...spec, extra: true })).toBe(false)
  })
})

describe.each(all.map((spec) => [spec.component, spec] as const))('the %s spec', (name, spec) => {
  it('is valid', () => {
    validate(spec)
    expect(validate.errors ?? []).toEqual([])
  })

  it('is the file of its name', () => {
    expect(specFiles).toContain(`${name}.spec.json`)
  })

  it('names only the kinds, states, parts and sizes it declares', () => {
    for (const row of spec.stateTable) {
      const where = JSON.stringify(row)
      for (const variant of rowVariants(spec, row))
        expect(spec.variants, where).toHaveProperty(variant)
      expect(spec.states, where).toHaveProperty(row.state)
      expect(spec.parts, where).toHaveProperty(row.part)
      if (row.size) expect(spec.sizes, where).toHaveProperty(row.size)
    }
    expect(spec.sizes).toHaveProperty(spec.defaultSize)
  })

  it('names tokens that exist, each of a type its property can take', () => {
    for (const row of spec.stateTable)
      expect(tokenProblem(row), JSON.stringify(row)).toBeUndefined()
  })

  it('names each property of a part in a state once, for a kind and a size', () => {
    const keys = expanded(spec).map(
      (row) => `${row.variant} ${row.state} ${row.part} ${row.property} ${row.size ?? '*'}`,
    )
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([])
    // a row for every size, or for none, so no size is left without its value
    const sized = new Map<string, Set<string>>()
    for (const row of expanded(spec).filter((row) => row.size)) {
      const key = `${row.variant} ${row.state} ${row.part} ${row.property}`
      sized.set(key, (sized.get(key) ?? new Set()).add(row.size!))
      expect(keys, key).not.toContain(`${key} *`)
    }
    for (const [key, sizes] of sized)
      expect([...sizes].sort(), key).toEqual(Object.keys(spec.sizes).sort())
  })

  it('has a gallery example of every kind in every state its table names, and of every size', () => {
    for (const id of spec.gallery) {
      const [component, variant, state, size] = id.split('.')
      expect(component, id).toBe(name)
      expect(spec.variants, id).toHaveProperty(variant!)
      expect(spec.states, id).toHaveProperty(state!)
      if (size) {
        expect(spec.sizes, id).toHaveProperty(size)
        // an example at the default size names none
        expect(size, id).not.toBe(spec.defaultSize)
      }
    }
    for (const row of expanded(spec))
      expect(spec.gallery, JSON.stringify(row)).toContain(`${name}.${row.variant}.${row.state}`)
    for (const size of Object.keys(spec.sizes).filter((size) => size !== spec.defaultSize))
      expect(
        spec.gallery.some((id) => id.endsWith(`.rest.${size}`)),
        size,
      ).toBe(true)
    for (const state of Object.keys(spec.states))
      expect(
        spec.gallery.some((id) => id.split('.')[2] === state),
        state,
      ).toBe(true)
  })

  it('maps every part, kind and size in each implementation that ships it', () => {
    for (const [implementation, { status, parts, variants, sizes }] of Object.entries(
      spec.implementations,
    )) {
      if (status !== 'shipped') continue
      expect(Object.keys(parts!).sort(), implementation).toEqual(Object.keys(spec.parts).sort())
      expect(Object.keys(variants!).sort(), implementation).toEqual(
        Object.keys(spec.variants).sort(),
      )
      expect(Object.keys(sizes!).sort(), implementation).toEqual(Object.keys(spec.sizes).sort())
    }
  })

  it('reads each token by the variable the build declares', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8')
    for (const row of spec.stateTable.filter((row) => row.token))
      expect(css, JSON.stringify(row)).toContain(`${cssVariable(row)}:`)
  })
})

describe('the specs and the component tier', () => {
  it('has a spec for each component it ships', () => {
    expect(all.map((spec) => spec.component)).toEqual(['button', 'input'])
  })

  it('reads every token of the tier in some spec', () => {
    const read = tokensRead(all)
    expect(ids.filter(inTier).filter((id) => !read.has(id))).toEqual([])
  })

  it('names a text style on a font property by the variable of that part', () => {
    expect(
      cssVariable({
        variant: '*',
        state: 'rest',
        part: 'root',
        property: 'font-size',
        token: 'text.label',
      }),
    ).toBe('--ws-text-label-font-size')
    expect(
      cssVariable({
        variant: 'primary',
        state: 'rest',
        part: 'root',
        property: 'background-color',
        token: 'button.primary.bg.rest',
      }),
    ).toBe('--ws-button-primary-bg-rest')
  })

  it('fails a token of the wrong type for its property', () => {
    const row = { variant: '*', state: 'rest', part: 'root' }
    expect(tokenProblem({ ...row, property: 'height', token: 'color.text' })).toMatch(
      /color\.text is a color/,
    )
    expect(tokenProblem({ ...row, property: 'color', token: 'color.nope' })).toMatch(/not a token/)
  })
})
