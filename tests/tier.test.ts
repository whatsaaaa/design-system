import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { allPairs, tierColors, tierPairs, tierStates } from '../scripts/lib/contrast.ts'
import { inTier, tierDirectory, tierFiles, tierGroups } from '../scripts/lib/tier.ts'
import { type TokenId, tokens } from '../scripts/lib/tokens.ts'

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

interface Node {
  $value?: unknown
  $type?: string
  [key: string]: unknown
}

/** Every token of a source file, by id, with the type it has or inherits from its group. */
function sourceTokens(node: Node, path: string[] = [], type?: string): [string, Node, string?][] {
  const own = node.$type ?? type
  if ('$value' in node) return [[path.join('.'), node, own]]
  return Object.entries(node)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => sourceTokens(child as Node, [...path, key], own))
}

const groups = tierFiles.map((file) => ({
  file,
  source: JSON.parse(readFileSync(join(tierDirectory, file), 'utf8')) as Record<string, Node>,
}))
const all = groups.flatMap(({ source }) => sourceTokens(source))
const ids = Object.keys(tokens('dark')) as TokenId[]

/** The measures a tier token can name, last in its id like a state: `control.height.md`. */
const sizes = ['xs', 'sm', 'md', 'lg', 'xl']

/** The properties of a tier token, in the system's own words. */
const properties = [
  ...tierColors,
  'height',
  'padding-inline',
  'padding-block',
  'gap',
  'radius',
  'border-width',
  'icon-size',
  'font-weight',
  'text-style',
]

describe('the component tier', () => {
  it('has its groups, and every token of them is built', () => {
    expect(tierGroups).toEqual(['control', 'field'])
    for (const [id] of all) expect(ids, id).toContain(id)
    expect(ids.filter(inTier)).toHaveLength(all.length)
  })

  it('aliases a semantic token with every token: no value of its own, no palette, no tier', () => {
    for (const [id, token] of all) {
      expect(token.$value, id).toMatch(/^\{[a-z0-9.-]+\}$/)
      const target = (token.$value as string).slice(1, -1)
      expect(ids, `${id} reads ${target}`).toContain(target)
      expect(target, id).not.toMatch(/^palette\./)
      expect(inTier(target), `${id} reads ${target}, a token of the tier`).toBe(false)
    }
  })

  it('names every token <group>.<variant>.<part>.<property>.<state>, in the closed lists', () => {
    for (const [id, , type] of all) {
      expect(id, id).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*(\.[a-z][a-z0-9]*(-[a-z0-9]+)*)+$/)
      const segments = id.split('.')
      const last = segments.at(-1)!
      const scaled = (tierStates as readonly string[]).includes(last) || sizes.includes(last)
      const property = scaled ? segments.at(-2)! : last
      expect(properties, id).toContain(property)
      // a color is a fill or what is drawn on it, so its contrast follows from its name, and it
      // takes a state or none: a size is for a measure
      if (type === 'color') {
        expect(tierColors as readonly string[], id).toContain(property)
        expect(sizes, id).not.toContain(last)
      } else expect(tierColors as readonly string[], id).not.toContain(property)
    }
  })

  it('keeps each group in a file of its name, and the resolver reads every one of them', () => {
    for (const { file, source } of groups)
      expect(Object.keys(source), file).toEqual([file.slice(0, -'.tokens.json'.length)])
    const resolver = JSON.parse(read('tokens/whatsaaaa.resolver.json'))
    expect(resolver.sets.components.sources.map((source: { $ref: string }) => source.$ref)).toEqual(
      tierFiles.map((file) => `components/${file}`),
    )
    // last, so it reads the roles of the theme chosen before it
    expect(resolver.resolutionOrder.at(-1)).toEqual({ $ref: '#/sets/components' })
  })

  it('is declared once, on every element that can choose a theme', () => {
    const css = read('dist/tokens.css')
    const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
      selectors: selectors!
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split(',')
        .map((selector) => selector.trim()),
      body: body!,
    }))
    for (const id of ids.filter(inTier)) {
      const declaration = `--ws-${id.replaceAll('.', '-')}:`
      const declaring = blocks.filter(({ body }) => body.includes(declaration))
      expect(declaring, id).toHaveLength(1)
      expect(declaring[0]!.selectors, id).toEqual([
        ':root',
        '[data-theme]',
        '.dark:where(:not(.light))',
        '.light:where(:not(.dark))',
      ])
    }
  })

  it('has the colors of its names measured for contrast', () => {
    const measured = new Set(allPairs().map((pair) => `${pair.foreground} on ${pair.background}`))
    for (const pair of [
      'field.text.rest on field.bg',
      'field.border.rest on color.bg',
      'field.border.invalid on color.bg',
      'field.label.text on color.bg',
      'field.help.text on color.bg',
      'field.error.text on color.bg',
      'field.error.icon on color.bg',
      'field.required.text on color.bg',
    ])
      expect(measured, pair).toContain(pair)
    // disabled is exempt, as WCAG exempts an inactive control
    expect(tierPairs().filter((pair) => pair.foreground.endsWith('.disabled'))).toEqual([])
    for (const pair of tierPairs())
      expect(pair.min, pair.use).toBe(/\.text\b/.test(pair.foreground) ? 4.5 : 3)
  })

  it('measures text, an edge and an icon at rest on every fill they keep, but not on disabled', () => {
    // an outlined button: its label, edge and icon stay as they are when its fill changes on hover
    const pairs = tierPairs([
      'button.danger.bg.rest',
      'button.danger.bg.hover',
      'button.danger.bg.disabled',
      'button.danger.text.rest',
      'button.danger.border.rest',
      'button.danger.icon',
    ] as unknown as TokenId[]).map(
      (pair) => `${pair.foreground} on ${pair.background} at ${pair.min}`,
    )
    expect(pairs.sort()).toEqual([
      'button.danger.border.rest on button.danger.bg.hover at 3',
      'button.danger.border.rest on button.danger.bg.rest at 3',
      'button.danger.border.rest on color.bg at 3',
      'button.danger.icon on button.danger.bg.hover at 3',
      'button.danger.icon on button.danger.bg.rest at 3',
      'button.danger.text.rest on button.danger.bg.hover at 4.5',
      'button.danger.text.rest on button.danger.bg.rest at 4.5',
    ])
  })

  it('fails on a color it cannot read, rather than leave it unmeasured', () => {
    expect(() =>
      tierPairs(['button.primary.bg.md', 'button.primary.text.md'] as unknown as TokenId[]),
    ).toThrow(/button\.primary\.bg\.md/)
  })

  it('measures no pair that is never drawn', () => {
    const pairs = tierPairs([
      // a selected tab draws its own text, and a checked box its own edge
      'tab.bg.rest',
      'tab.bg.selected',
      'tab.text.rest',
      'tab.text.selected',
      'checkbox.bg.rest',
      'checkbox.bg.checked',
      'checkbox.border.rest',
      'checkbox.border.checked',
      // the icon of a filled button is on its fill, never on the page
      'button.primary.bg.rest',
      'button.primary.icon',
    ] as unknown as TokenId[]).map(
      (pair) => `${pair.foreground} on ${pair.background} at ${pair.min}`,
    )
    expect(pairs.sort()).toEqual([
      'button.primary.icon on button.primary.bg.rest at 3',
      'checkbox.border.checked on checkbox.bg.checked at 3',
      'checkbox.border.checked on color.bg at 3',
      'checkbox.border.rest on checkbox.bg.rest at 3',
      'checkbox.border.rest on color.bg at 3',
      'tab.text.rest on tab.bg.rest at 4.5',
      'tab.text.selected on tab.bg.selected at 4.5',
    ])
  })
})
