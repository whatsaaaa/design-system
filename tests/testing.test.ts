import { describe, expect, it } from 'vitest'
import {
  type Spec,
  cssVariable,
  describeCondition,
  describeRow,
  example,
  expectations,
  loadSpec,
  partTargets,
} from '../src/testing/spec.ts'
import { importWithout, pkg } from './peers.ts'

const button = loadSpec('button')
const input = loadSpec('input')

/**
 * What an example is held to, as `part property: token or value`, with the condition of a row
 * that has one: `root padding-inline-start with leading-icon`.
 */
const held = (spec = button, id: string) =>
  Object.fromEntries(
    expectations(spec, example(spec, id)).map(({ part, property, row }) => [
      [part, property, describeCondition(row)].filter(Boolean).join(' '),
      row.token ?? row.value,
    ]),
  )

describe('the parity helper reads a spec', () => {
  it('takes an id without a size at the default size', () => {
    expect(example(button, 'button.primary.hover')).toEqual({
      id: 'button.primary.hover',
      variant: 'primary',
      state: 'hover',
      size: 'md',
    })
    expect(example(button, 'button.primary.rest.xs').size).toBe('xs')
    expect(() => example(button, 'input.outline.rest')).toThrow(/not an example of the button/)
  })

  it('holds an example to the rows at rest, with its state over them', () => {
    const hover = held(button, 'button.primary.hover')
    expect(hover['root background-color']).toBe('button.primary.bg.hover')
    expect(hover['root color']).toBe('button.primary.text.rest')
    expect(hover['root height']).toBe('control.height.md')
    // a row of a state holds only in that state
    expect(held(button, 'button.primary.rest')['root background-color']).toBe(
      'button.primary.bg.rest',
    )
    expect(hover).not.toHaveProperty('root outline-width')
  })

  it('holds an example only to the rows of its kind and its size', () => {
    const quiet = held(button, 'button.quiet.disabled')
    expect(quiet['root text-decoration-line']).toBe('none')
    expect(quiet['root font-weight']).toBe('font.weight.regular')
    expect(quiet).not.toHaveProperty('root height')
    const xs = held(button, 'button.primary.rest.xs')
    expect(xs['root height']).toBe('control.height.xs')
    expect(xs['leading-icon width']).toBe('control.icon-size.xs')
  })

  it('holds a loading example to the look at rest, as the spec says it keeps it', () => {
    expect(held(button, 'button.danger.loading')).toEqual(held(button, 'button.danger.rest'))
  })

  it('holds an example to both rows of a condition, which the page chooses between', () => {
    const md = held(input, 'input.outline.loading')
    expect(md['root padding-inline-start without leading-icon']).toBe('space.12')
    expect(md['root padding-inline-start with leading-icon']).toBe(
      'calc(var(--ws-space-12) + var(--ws-control-icon-size-md) + var(--ws-control-gap-md))',
    )
    expect(md['root padding-inline-end without trailing-icon']).toBe('space.12')
    expect(md).not.toHaveProperty('root padding-inline')
    expect(held(input, 'input.outline.rest.xs')['root padding-inline-end with trailing-icon']).toBe(
      'calc(var(--ws-space-8) + var(--ws-control-icon-size-xs) + var(--ws-control-gap-xs))',
    )
  })

  it('holds a field with an error to its padding at rest less the wider edge, with an icon or not', () => {
    const extra = '(var(--ws-control-border-width-invalid) - var(--ws-control-border-width-rest))'
    const xs = held(input, 'input.outline.invalid.xs')
    expect(xs['root padding-inline-start without leading-icon']).toBe(
      `calc(var(--ws-space-8) - ${extra})`,
    )
    expect(xs['root padding-inline-end with trailing-icon']).toBe(
      `calc(var(--ws-space-8) + var(--ws-control-icon-size-xs) + var(--ws-control-gap-xs) - ${extra})`,
    )
    // the rows of the error take the place of those at rest, at every size and on both sides
    for (const id of ['', '.xs', '.sm', '.lg', '.xl'].map((size) => `input.outline.invalid${size}`))
      for (const row of expectations(input, example(input, id)))
        if (row.property.startsWith('padding-inline')) expect(row.row.state, id).toBe('invalid')
  })

  it('takes a row of a state in place of those at rest with its condition, or of all of them', () => {
    const rest = { variant: '*', state: 'rest', part: 'root', property: 'padding-inline-start' }
    const spec: Spec = {
      ...input,
      stateTable: [
        { ...rest, with: 'leading-icon', token: 'space.20' },
        { ...rest, without: 'leading-icon', token: 'space.12' },
        { ...rest, state: 'invalid', with: 'leading-icon', token: 'space.24' },
        { ...rest, state: 'disabled', token: 'space.8' },
      ],
    }
    expect(held(spec, 'input.outline.invalid')).toEqual({
      'root padding-inline-start without leading-icon': 'space.12',
      'root padding-inline-start with leading-icon': 'space.24',
    })
    expect(held(spec, 'input.outline.disabled')).toEqual({
      'root padding-inline-start': 'space.8',
    })
  })

  it('says a row with its size and its condition', () => {
    const row = input.stateTable.find(
      (row) => row.property === 'padding-inline-start' && row.size === 'xs' && row.with,
    )!
    expect(describeRow(row)).toBe('* rest root padding-inline-start at xs with leading-icon')
  })

  it('reads a text style on a font property as that part of it', () => {
    const [size] = expectations(input, example(input, 'input.outline.rest')).filter(
      ({ part, property }) => part === 'label' && property === 'font-size',
    )
    expect(cssVariable(size!.row)).toBe('--ws-text-label-font-size')
    expect(cssVariable({ ...size!.row, token: 'button.primary.bg.rest' })).toBe(
      '--ws-button-primary-bg-rest',
    )
  })
})

describe("the parity helper reads an implementation's map of parts", () => {
  it('finds a part the map does not name in the slot of its own name', () => {
    expect(partTargets(button)).toEqual({
      root: { selector: '[data-slot="root"]' },
      label: { selector: '[data-slot="label"]' },
      'leading-icon': { selector: '[data-slot="leading-icon"]' },
      'trailing-icon': { selector: '[data-slot="trailing-icon"]' },
    })
    expect(partTargets(button, { root: 'base' })).toEqual({
      ...partTargets(button),
      root: { selector: '[data-slot="base"]' },
    })
  })

  it('finds a part in a slot, a pseudo-element of a slot, or a slot inside others', () => {
    const targets = partTargets(input, {
      root: 'base',
      placeholder: 'base::placeholder',
      'leading-icon': 'field base leadingIcon',
      'error-icon': 'error-text::before',
    })
    expect(targets.root).toEqual({ selector: '[data-slot="base"]' })
    expect(targets.placeholder).toEqual({ selector: '[data-slot="base"]', pseudo: '::placeholder' })
    expect(targets['leading-icon']).toEqual({
      selector: '[data-slot="field"] [data-slot="base"] [data-slot="leadingIcon"]',
    })
    expect(targets['error-icon']).toEqual({
      selector: '[data-slot="error-text"]',
      pseudo: '::before',
    })
  })

  it('fails a map that names a part the spec does not have, and names it', () => {
    expect(() => partTargets(button, { rooot: 'base' })).toThrow(
      'the button spec has no part rooot. Its parts are: root, label, leading-icon, trailing-icon',
    )
    expect(() => partTargets(button, { root: 'base', icon: 'leadingIcon', text: 'label' })).toThrow(
      'the button spec has no parts icon, text. Its parts are: root',
    )
  })

  it('fails a map that draws a part as anything but slots and a pseudo-element', () => {
    for (const as of ['.button', 'base > icon', 'label:after', 'base::', ' base', 'base  icon', ''])
      expect(() => partTargets(button, { root: as }), as).toThrow(
        `the part root of the button spec cannot be drawn as "${as}": a part map names a slot`,
      )
  })
})

describe('the testing entry', () => {
  // A Node process of its own that imports every entry: several seconds beside other builds.
  it('is the only entry that needs Playwright, an optional peer', () => {
    expect(importWithout(['@playwright/test']).needing).toEqual([`${pkg.name}/testing`])
    expect(pkg.peerDependenciesMeta['@playwright/test']).toEqual({ optional: true })
    expect(pkg.dependencies).not.toHaveProperty('@playwright/test')
  }, 30_000)
})
