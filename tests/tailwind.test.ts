import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileAst } from 'tailwindcss'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type CssToken, tailwindTheme } from '../scripts/lib/tailwind.ts'
import { type TokenId, tokens } from '../scripts/lib/tokens.ts'
import { buildTailwindApp } from './fixtures/tailwind-app/build.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (file: string) => readFileSync(join(root, file), 'utf8')
const ids = (prefix: string) =>
  Object.keys(tokens('dark'))
    .filter((id) => id.startsWith(`${prefix}.`))
    .map((id) => id.slice(prefix.length + 1))
const value = (id: string) => tokens('dark')[id as TokenId].$value
/** A token as CSS reads it: its variable, which every token has under its id. */
const token = (id: string) => `var(--ws-${id.replaceAll('.', '-')})`

const ENTRY = '@whatsaaaa/design-system/tailwind.css'

type AstNode = Parameters<typeof compileAst>[0][number]

/**
 * What Tailwind's compiler makes of an app's stylesheet that imports the sheet given, for the
 * candidates it finds in the app. Sheets resolve as an app's build resolves them, the package's
 * own by its name, and the ones of `sheets` by theirs.
 */
async function compile(
  sheet: string,
  candidates: string[] = [],
  sheets: Record<string, string> = {},
): Promise<AstNode[]> {
  const { build } = await compileAst(
    [{ kind: 'at-rule', name: '@import', params: `'${sheet}'`, nodes: [] }],
    {
      base: root,
      loadStylesheet: async (id, base) => {
        const content = sheets[id]
        if (content !== undefined) return { path: join(base, id), base, content }
        const path = id.startsWith('.')
          ? join(base, id)
          : createRequire(join(base, 'app.js')).resolve(id)
        return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
      },
    },
  )
  return build(candidates)
}

/**
 * The declarations of the utility Tailwind makes of each candidate, by candidate, or none where
 * it makes nothing of it.
 */
async function utilities(candidates: string[], sheet = ENTRY, sheets: Record<string, string> = {}) {
  const rules = new Map<string, Record<string, string | undefined>>()
  const walk = (nodes: AstNode[], layer?: string): void => {
    for (const node of nodes)
      if (node.kind === 'at-rule' && node.name === '@layer') walk(node.nodes, node.params)
      else if (node.kind === 'context' || node.kind === 'at-root') walk(node.nodes, layer)
      else if (node.kind === 'rule' && layer === 'utilities')
        rules.set(
          node.selector,
          Object.fromEntries(
            node.nodes.flatMap((child) =>
              child.kind === 'declaration' ? [[child.property, child.value]] : [],
            ),
          ),
        )
  }
  walk(await compile(sheet, candidates, sheets))
  return Object.fromEntries(
    candidates.map((candidate) => [candidate, rules.get(`.${candidate.replaceAll('.', '\\.')}`)]),
  )
}

/** Expects Tailwind to make each candidate of an app on the entry into the declarations given. */
async function expectUtilities(expected: [candidate: string, declarations: unknown][]) {
  expect(await utilities(expected.map(([candidate]) => candidate))).toEqual(
    Object.fromEntries(expected),
  )
}

/** Tailwind's names of the font weights, by weight, from its docs: font-normal is 400. */
const tailwindWeights: Record<number, string> = {
  100: 'thin',
  200: 'extralight',
  300: 'light',
  400: 'normal',
  500: 'medium',
  600: 'semibold',
  700: 'bold',
  800: 'extrabold',
  900: 'black',
}

describe("the tokens as Tailwind's theme, as Tailwind compiles an app on the entry", () => {
  it('colors with every role', async () => {
    await expectUtilities(
      ids('color').map((role) => [`bg-${role}`, { 'background-color': token(`color.${role}`) }]),
    )
  })

  it('sets every text style with its line height, letter spacing and weight', async () => {
    const styles = ids('text')
    const made = await utilities(styles.map((style) => `text-${style}`))
    for (const style of styles) {
      const part = (name: string) => token(`text.${style}.${name}`)
      // a leading-*, tracking-* or font-* next to the style still wins over its part
      expect(made[`text-${style}`], style).toEqual({
        'font-size': part('font-size'),
        'line-height': expect.stringContaining(part('line-height')),
        'letter-spacing': expect.stringContaining(part('letter-spacing')),
        'font-weight': expect.stringContaining(part('font-weight')),
      })
    }
  })

  it("sets the families, the line heights and the weights, the weights by Tailwind's names", async () => {
    await expectUtilities([
      ...ids('font.family').map((name): [string, unknown] => [
        `font-${name}`,
        { 'font-family': token(`font.family.${name}`) },
      ]),
      ...ids('font.line-height').map((name): [string, unknown] => [
        `leading-${name}`,
        expect.objectContaining({ 'line-height': token(`font.line-height.${name}`) }),
      ]),
      ...ids('font.weight').map((name): [string, unknown] => [
        `font-${tailwindWeights[Number(value(`font.weight.${name}`))]}`,
        expect.objectContaining({ 'font-weight': token(`font.weight.${name}`) }),
      ]),
    ])
  })

  it("spaces on Tailwind's scale of a quarter rem to a step, and sizes by name", async () => {
    // p-<n> is n of Tailwind's steps, and the step is space.4, so every space is a p-* of its own
    expect(value('space.4')).toEqual({ value: 0.25, unit: 'rem' })
    await expectUtilities([
      ...ids('space').map((name): [string, unknown] => {
        const { value: rem, unit } = value(`space.${name}`) as { value: number; unit: string }
        expect(unit, name).toBe('rem')
        return [`p-${rem / 0.25}`, { padding: expect.stringContaining(token('space.4')) }]
      }),
      ...ids('size').flatMap((name): [string, unknown][] => [
        [`h-${name}`, { height: token(`size.${name}`) }],
        [`max-w-${name}`, { 'max-width': token(`size.${name}`) }],
      ]),
    ])
  })

  it("rounds with the radii, and rounded-full is Tailwind's own", async () => {
    const { 'rounded-full': full } = await utilities(['rounded-full'], 'tailwindcss/index.css')
    expect(full).toBeDefined()
    await expectUtilities([
      ...ids('radius')
        .filter((name) => name !== 'full')
        .map((name): [string, unknown] => [
          `rounded-${name}`,
          { 'border-radius': token(`radius.${name}`) },
        ]),
      ['rounded-full', full],
    ])
  })

  it('draws borders with the widths by name, on every side or on one', async () => {
    await expectUtilities(
      ids('border-width').flatMap((name): [string, unknown][] => [
        [
          `border-${name}`,
          expect.objectContaining({ 'border-width': token(`border-width.${name}`) }),
        ],
        [
          `border-b-${name}`,
          expect.objectContaining({ 'border-bottom-width': token(`border-width.${name}`) }),
        ],
      ]),
    )
  })

  it('eases with the easings, and a transition takes the fast duration', async () => {
    const easing = (name: string) =>
      expect.objectContaining({ 'transition-timing-function': token(`motion.easing.${name}`) })
    await expectUtilities([
      ...ids('motion.easing').map((name): [string, unknown] => [`ease-${name}`, easing(name)]),
      ['ease-in-out', easing('standard')],
      [
        'transition',
        expect.objectContaining({
          'transition-duration': expect.stringContaining(token('motion.duration.fast')),
          'transition-timing-function': expect.stringContaining(token('motion.easing.standard')),
        }),
      ],
    ])
  })

  it("takes out Tailwind's defaults that no token stands behind, as the usage guide lists", async () => {
    const removed = [
      'bg-white',
      'text-black',
      'text-red-500',
      'border-slate-200',
      'shadow-lg',
      'inset-shadow-sm',
      'drop-shadow-md',
      'text-shadow-md',
      'font-serif',
      'font-thin',
      'font-extralight',
      'font-light',
      'font-black',
      'rounded-2xl',
      'rounded-3xl',
      'rounded-4xl',
    ]
    const tailwind = await utilities(removed, 'tailwindcss/index.css')
    expect(removed.filter((candidate) => !tailwind[candidate])).toEqual([])
    await expectUtilities(removed.map((candidate) => [candidate, undefined]))
  })

  describe('as the token build writes it', () => {
    /** A token as the CSS plugin hands it over. */
    const cssToken = (id: string, value: CssToken['value'] = '1rem'): CssToken => ({
      id,
      localID: `--ws-${id.replaceAll('.', '-')}`,
      value,
    })
    const base = [
      cssToken('space.4', '0.25rem'),
      cssToken('space.16', '1rem'),
      cssToken('motion.easing.standard', 'cubic-bezier(0.2, 0, 0, 1)'),
      cssToken('motion.duration.fast', '120ms'),
    ]

    it('takes a token added to a group it maps, with no change to the mapping', async () => {
      const theme = tailwindTheme([
        ...base,
        cssToken('color.interactive-hover', '#acdfe8'),
        cssToken('size.control', '2.5rem'),
        cssToken('text.tagline', {
          'font-size': '1.25rem',
          'line-height': '1.5',
          'letter-spacing': '0rem',
          'font-weight': '500',
          'font-family': 'var(--ws-font-family-sans)',
        }),
      ])
      const app = `@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
${theme}`
      const made = await utilities(
        ['bg-interactive-hover', 'h-control', 'text-tagline'],
        'app.css',
        {
          'app.css': app,
        },
      )
      expect(made['bg-interactive-hover']).toEqual({
        'background-color': token('color.interactive-hover'),
      })
      expect(made['h-control']).toEqual({ height: token('size.control') })
      expect(made['text-tagline']).toMatchObject({
        'font-size': token('text.tagline.font-size'),
        'font-weight': expect.stringContaining(token('text.tagline.font-weight')),
      })
    })

    it('fails on a group it neither maps nor leaves out, so a new group is a decision', () => {
      expect(() => tailwindTheme([...base, cssToken('elevation.1', '2px')])).toThrow(/elevation\.1/)
    })

    it('fails on a space that is not on Tailwind’s scale of four pixels to a step', () => {
      expect(() => tailwindTheme([...base, cssToken('space.10', '0.7rem')])).toThrow(/space\.10/)
    })
  })
})

/**
 * What a stylesheet gives a page, as Tailwind's compiler reads it: the ws- classes it styles,
 * the --ws- variables it sets and the font files it serves.
 */
function vocabulary(nodes: AstNode[]): string[] {
  return nodes.flatMap((node): string[] => {
    switch (node.kind) {
      case 'rule':
        return [
          ...[...node.selector.matchAll(/\.ws-[\w-]+/g)].map(([name]) => name),
          ...vocabulary(node.nodes),
        ]
      case 'declaration':
        if (node.property === 'src')
          return [...(node.value ?? '').matchAll(/[\w-]+\.woff2/g)].map(([file]) => file)
        return node.property.startsWith('--ws-') ? [node.property] : []
      case 'comment':
        return []
      default:
        return vocabulary(node.nodes)
    }
  })
}

describe('the Tailwind entry', () => {
  it('brings everything index.css brings', async () => {
    const index = new Set(vocabulary(await compile('./dist/index.css')))
    const entry = new Set(vocabulary(await compile(ENTRY)))
    expect([...index]).toEqual(
      expect.arrayContaining([
        '.ws-prose',
        '.ws-callout',
        '--ws-color-bg',
        '--ws-icon-note',
        'inter-latin-wght-normal.woff2',
      ]),
    )
    expect([...index].filter((word) => !entry.has(word))).toEqual([])
  })

  it('is the one file that needs Tailwind, which stays optional', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.peerDependencies.tailwindcss).toMatch(/^\^4\./)
    expect(pkg.peerDependenciesMeta.tailwindcss.optional).toBe(true)
    const files = (dir: string): string[] =>
      readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
      )
    const needing = files('dist').filter(
      (file) => /\.(css|js)$/.test(file) && read(file).includes('tailwindcss'),
    )
    expect(needing).toEqual(['dist/tailwind.css'])
  })
})

describe('an app built on the entry', () => {
  const out = mkdtempSync(join(tmpdir(), 'ws-tailwind-app-'))
  let css = ''
  beforeAll(async () => {
    await buildTailwindApp(out)
    const assets = readdirSync(join(out, 'assets'))
    css = readFileSync(
      join(
        out,
        'assets',
        assets.find((file) => file.endsWith('.css'))!,
      ),
      'utf8',
    )
  }, 120_000)
  afterAll(() => rmSync(out, { recursive: true, force: true }))

  it('gets utilities that read the tokens where they are used', () => {
    for (const rule of [
      '.bg-surface{background-color:var(--ws-color-surface)}',
      '.font-mono{font-family:var(--ws-font-family-mono)}',
      '.font-sans{font-family:var(--ws-font-family-sans)}',
      '.rounded-md{border-radius:var(--ws-radius-md)}',
      '.h-tab-bar{height:var(--ws-size-tab-bar)}',
      '.p-6{padding:calc(var(--ws-space-4) * 6)}',
      '.text-h1{font-size:var(--ws-text-h1-font-size);',
    ])
      expect(css).toContain(rule)
  })

  it("has the system's layers in Tailwind's order, and none of Tailwind's palette", () => {
    expect(css).toMatch(/@layer theme\{[\s\S]*@layer base\{[\s\S]*@layer components\{/)
    expect(css).not.toMatch(/--color-(red|slate|black|white)\b/)
    expect(css).not.toContain('box-shadow:var(--tw-shadow')
  })

  it('serves the fonts with the app', () => {
    const fonts = readdirSync(join(out, 'assets')).filter((file) => file.endsWith('.woff2'))
    expect(fonts.length).toBeGreaterThan(0)
    for (const font of fonts) expect(css).toContain(`/assets/${font}`)
    expect(existsSync(join(out, 'index.html'))).toBe(true)
  })
})
