import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Ajv2020 } from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'
import { tierStates } from '../scripts/lib/contrast.ts'
import {
  type Spec,
  type SpecRow,
  cssVariable,
  describeCondition,
  rowCondition,
  rowVariants,
  specDirectory,
  specFiles,
  specs,
  tokenProblem,
  tokensRead,
} from '../scripts/lib/specs.ts'
import { inTier } from '../scripts/lib/tier.ts'
import { type TokenId, tokens } from '../scripts/lib/tokens.ts'
import specPages from '../styleguide/.vitepress/data/specs.data.ts'

const schema = JSON.parse(readFileSync(join(specDirectory, 'spec.schema.json'), 'utf8'))
const validate = new Ajv2020({ allErrors: true }).compile(schema)
const all = specs()
const ids = Object.keys(tokens('dark')) as TokenId[]

/** Every row of a spec once for each kind it holds for. */
const expanded = (spec: Spec) =>
  spec.stateTable.flatMap((row) => rowVariants(spec, row).map((variant) => ({ ...row, variant })))

/** A row's kind, state, part, property and size, or `*` for every size. */
const place = (row: SpecRow, size = row.size ?? '*') =>
  `${row.variant} ${row.state} ${row.part} ${row.property} ${size}`

/** Where a row holds, as the style guide shows it: `with leading-icon`, or nothing. */
const conditionOf = (row: SpecRow) => describeCondition(row) || undefined

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

  it('takes a row that holds with a part drawn, or without it, but not both', () => {
    const [spec] = all
    const row = {
      variant: '*',
      state: 'rest',
      part: 'root',
      property: 'color',
      token: 'color.text',
    }
    expect(validate({ ...spec, stateTable: [{ ...row, with: 'leading-icon' }] })).toBe(true)
    expect(validate({ ...spec, stateTable: [{ ...row, without: 'leading-icon' }] })).toBe(true)
    expect(
      validate({ ...spec, stateTable: [{ ...row, with: 'leading-icon', without: 'label' }] }),
    ).toBe(false)
    expect(validate({ ...spec, stateTable: [{ ...row, with: 'Leading icon' }] })).toBe(false)
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
      const condition = rowCondition(row)
      if (condition) expect(spec.parts, where).toHaveProperty(condition.part)
    }
    expect(spec.sizes).toHaveProperty(spec.defaultSize)
  })

  it('names tokens that exist, each of a type its property can take', () => {
    for (const row of spec.stateTable)
      expect(tokenProblem(row), JSON.stringify(row)).toBeUndefined()
  })

  it('names each property of a part in a state once, for a kind, a size and a condition', () => {
    const keys = expanded(spec).map((row) => `${place(row)} ${conditionOf(row) ?? '*'}`)
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([])
    // a row for every size, or for none, so no size is left without its value
    const sized = new Map<string, Set<string>>()
    for (const row of expanded(spec).filter((row) => row.size)) {
      const key = `${row.variant} ${row.state} ${row.part} ${row.property} ${conditionOf(row) ?? '*'}`
      sized.set(key, (sized.get(key) ?? new Set()).add(row.size!))
      expect(keys, key).not.toContain(`${place(row, '*')} ${conditionOf(row) ?? '*'}`)
    }
    for (const [key, sizes] of sized)
      expect([...sizes].sort(), key).toEqual(Object.keys(spec.sizes).sort())
  })

  it('gives a row with a condition its other half, so every example is held to one of them', () => {
    const rows = expanded(spec)
    for (const row of rows.filter((row) => rowCondition(row))) {
      const { part, drawn } = rowCondition(row)!
      // the other half, and no row without a condition beside the two
      const others = rows.filter((other) => other !== row && place(other) === place(row))
      expect(others.map(rowCondition), JSON.stringify(row)).toEqual([{ part, drawn: !drawn }])
    }
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

describe('the component pages', () => {
  const pages = specPages.load()

  it.each(all.map((spec) => [spec.component, spec] as const))(
    'show each row of the %s spec that differs by size once, in its state and for its kinds',
    (name, spec) => {
      for (const row of spec.stateTable.filter((row) => row.size)) {
        const kinds = row.variant === '*' ? undefined : rowVariants(spec, row)
        const shown = pages[name]!.sizeRows.filter(
          (entry) =>
            entry.state === row.state &&
            String(entry.variants) === String(kinds) &&
            entry.targets.some(
              (target) =>
                target.part === row.part &&
                target.property === row.property &&
                target.condition === conditionOf(row),
            ),
        )
        expect(shown, JSON.stringify(row)).toHaveLength(1)
        const cell = shown[0]!.cells[row.size!]
        expect(cell?.token ?? cell?.value, JSON.stringify(row)).toBe(row.token ?? row.value)
      }
    },
  )

  it('shows a tint written as a value by its color and how much of it', () => {
    const rows = pages.modal!.stateGroups.flatMap((group) => group.rows)
    const { cell } = rows.find((row) => row.part === 'overlay')!
    expect(cell.formula).toBe('color.bg at 80%')
    expect(cell.dark).toEqual({ text: '#191724 at 80%', color: '#191724cc' })
    expect(cell.light).toEqual({ text: '#faf4ed at 80%', color: '#faf4edcc' })
  })

  it('shows a sum of lengths by its total, and the tokens it reads', () => {
    const row = pages.input!.sizeRows.find((entry) =>
      entry.targets.some(
        (target) =>
          target.property === 'padding-inline-start' && target.condition === 'with leading-icon',
      ),
    )!
    // the measures of ui-vue's fields: the padding, the icon and the gap
    expect(
      Object.fromEntries(Object.entries(row.cells).map(([size, cell]) => [size, cell.dark.text])),
    ).toEqual({ xs: '30px', sm: '32px', md: '36px', lg: '42px', xl: '46px' })
    expect(row.cells.md!.valueTokens).toEqual([
      'space.12',
      'control.icon-size.md',
      'control.gap.md',
    ])
    // what follows the size is named once, and each size's padding in its cell
    expect(row.sum).toEqual({
      plus: ['control.icon-size.<size>', 'control.gap.<size>'],
      less: [],
      own: {
        xs: ['space.8'],
        sm: ['space.10'],
        md: ['space.12'],
        lg: ['space.14'],
        xl: ['space.16'],
      },
    })
  })

  it('shows a padding less the wider edge of an error by its total, and what it takes away', () => {
    const rows = pages.input!.sizeRows.filter(
      (entry) =>
        entry.state === 'invalid' &&
        entry.targets.some((target) => target.property === 'padding-inline-start'),
    )
    const totals = rows.map((row) => Object.values(row.cells).map((cell) => cell.dark.text))
    // the measures of ui-vue's fields in an error, whose value keeps its place
    expect(totals).toEqual([
      ['7px', '9px', '11px', '13px', '15px'],
      ['29px', '31px', '35px', '41px', '45px'],
    ])
    const extra = '(control.border-width.invalid - control.border-width.rest)'
    expect(rows.map((row) => row.sum?.less)).toEqual([[extra], [extra]])
    expect(rows[1]!.sum!.plus).toEqual(['control.icon-size.<size>', 'control.gap.<size>'])
    expect(rows[0]!.cells.md!.formula).toBe(`space.12 - ${extra}`)
  })
})

describe('the specs and the component tier', () => {
  it('has a spec for each component it ships', () => {
    expect(all.map((spec) => spec.component)).toEqual([
      'button',
      'checkbox',
      'input',
      'modal',
      'radio-group',
      'select',
      'select-menu',
    ])
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

  it('reads the tokens a value names by their variables, each of a type its property can take', () => {
    const row = { variant: '*', state: 'rest', part: 'root', property: 'padding-inline-start' }
    const sum =
      'calc(var(--ws-space-12) + var(--ws-control-icon-size-md) + var(--ws-control-gap-md))'
    expect(tokenProblem({ ...row, value: sum })).toBeUndefined()
    expect(tokenProblem({ ...row, value: 'calc(var(--ws-space-nope) + 1px)' })).toMatch(
      /--ws-space-nope, in .+, is not a token's variable/,
    )
    expect(tokenProblem({ ...row, value: 'calc(var(--ws-color-text) + 1px)' })).toMatch(
      /color\.text is a color/,
    )
    expect(tokensRead([{ ...all[0]!, stateTable: [{ ...row, value: sum }] }])).toEqual(
      new Set(['space.12', 'control.icon-size.md', 'control.gap.md']),
    )
  })
})
