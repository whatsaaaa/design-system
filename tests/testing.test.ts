import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { cssVariable, example, expectations, loadSpec, specNames } from '../src/testing/spec.ts'
import { specFiles } from '../scripts/lib/specs.ts'

const button = loadSpec('button')
const input = loadSpec('input')

/** What an example is held to, as `part property: token or value`. */
const held = (spec = button, id: string) =>
  Object.fromEntries(
    expectations(spec, example(spec, id)).map(({ part, property, row }) => [
      `${part} ${property}`,
      row.token ?? row.value,
    ]),
  )

describe('the parity helper reads a spec', () => {
  it('finds every published spec', () => {
    expect(specNames().map((name) => `${name}.spec.json`)).toEqual(specFiles)
  })

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
  const modules = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true, recursive: true })
      .filter((entry) => entry.isFile() && /\.(js|ts|vue)$/.test(entry.name))
      .map((entry) => join(entry.parentPath, entry.name))

  it('is the only module that imports Playwright, an optional peer', () => {
    const importers = [...modules(join(root, 'dist')), ...modules(join(root, 'src'))]
      .filter((file) => readFileSync(file, 'utf8').includes(`from '@playwright/test'`))
      .map((file) => relative(root, file))
      .sort()
    expect(importers).toEqual([
      'dist/testing/index.d.ts',
      'dist/testing/index.js',
      'src/testing/index.ts',
    ])
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(pkg.peerDependenciesMeta['@playwright/test']).toEqual({ optional: true })
    expect(pkg.dependencies).not.toHaveProperty('@playwright/test')
  })
})
