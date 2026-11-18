import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  type Spec,
  cssVariable,
  describeCondition,
  describeRow,
  example,
  expectations,
  loadSpec,
} from '../src/testing/spec.ts'

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
    expect(
      held(input, 'input.outline.invalid.xs')['root padding-inline-end with trailing-icon'],
    ).toBe('calc(var(--ws-space-8) + var(--ws-control-icon-size-xs) + var(--ws-control-gap-xs))')
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

describe('the testing entry', () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  it('is the only entry that needs Playwright, an optional peer', () => {
    // every module the exports map names, imported in a Node process that cannot find
    // @playwright/test, as one where it is not installed. An entry made for the browser fails
    // there for want of a document, so what counts is why an entry fails.
    const entries = Object.entries<string | Record<string, string>>(pkg.exports)
      .filter(([, target]) =>
        /\.[jt]s$/.test(typeof target === 'string' ? target : target.default!),
      )
      .map(([subpath]) => `${pkg.name}${subpath.slice(1)}`)
    const script = `
      import { registerHooks } from 'node:module'
      const missing = "Cannot find package '@playwright/test'"
      registerHooks({
        resolve(specifier, context, next) {
          if (specifier === '@playwright/test') throw new Error(missing)
          return next(specifier, context)
        },
      })
      const needing = []
      for (const entry of ${JSON.stringify(entries)})
        await import(entry).catch((error) => error.message === missing && needing.push(entry))
      console.log(JSON.stringify(needing))
    `
    const needing = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    expect(JSON.parse(needing)).toEqual([`${pkg.name}/testing`])
    expect(pkg.peerDependenciesMeta['@playwright/test']).toEqual({ optional: true })
    expect(pkg.dependencies).not.toHaveProperty('@playwright/test')
  })
})
