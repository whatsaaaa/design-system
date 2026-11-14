import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type CssToken, tailwindTheme } from '../scripts/lib/tailwind.ts'
import { tokens } from '../scripts/lib/tokens.ts'
import { buildTailwindApp } from './fixtures/tailwind-app/build.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (file: string) => readFileSync(join(root, file), 'utf8')
const ids = (prefix: string) =>
  Object.keys(tokens('dark'))
    .filter((id) => id.startsWith(`${prefix}.`))
    .map((id) => id.slice(prefix.length + 1))

describe("the tokens as Tailwind's theme", () => {
  const theme = read('dist/tailwind/theme.css')

  it('has every color role, and only the roles', () => {
    expect(theme).toContain('--color-*: initial;')
    for (const role of ids('color'))
      expect(theme).toContain(`--color-${role}: var(--ws-color-${role});`)
    expect(theme.match(/--color-[\w-]+:/g)).toHaveLength(ids('color').length)
  })

  it('has every text style, with its line height, letter spacing and weight', () => {
    for (const style of ids('text')) {
      expect(theme).toContain(`--text-${style}: var(--ws-text-${style}-font-size);`)
      for (const part of ['line-height', 'letter-spacing', 'font-weight'])
        expect(theme).toContain(`--text-${style}--${part}: var(--ws-text-${style}-${part});`)
    }
  })

  it('has both families, the line heights, the weights, the radii, the widths and the sizes', () => {
    for (const family of ids('font.family'))
      expect(theme).toContain(`--font-${family}: var(--ws-font-family-${family});`)
    for (const height of ids('font.line-height'))
      expect(theme).toContain(`--leading-${height}: var(--ws-font-line-height-${height});`)
    expect(theme).toContain('--font-weight-normal: var(--ws-font-weight-regular);')
    for (const radius of ids('radius').filter((name) => name !== 'full'))
      expect(theme).toContain(`--radius-${radius}: var(--ws-radius-${radius});`)
    for (const width of ids('border-width'))
      expect(theme).toContain(`--border-width-${width}: var(--ws-border-width-${width});`)
    for (const size of ids('size'))
      expect(theme).toContain(`--spacing-${size}: var(--ws-size-${size});`)
    expect(theme).toContain('--spacing: var(--ws-space-4);')
  })

  it('has no value of its own: every one is a token', () => {
    for (const file of [
      'dist/tailwind.css',
      'dist/tailwind/theme.css',
      'dist/tailwind/variants.css',
    ])
      expect(read(file), file).not.toMatch(/#[\da-f]{3,8}\b/i)
    for (const declaration of theme.match(/^\s+--[\w*-]+: [^;]+;/gm) ?? [])
      expect(declaration).toMatch(/: (initial|var\(--ws-[\w-]+\));$/)
  })

  describe('as the token build writes it', () => {
    /** A token as the CSS plugin hands it over. */
    const token = (id: string, value: CssToken['value'] = '1rem'): CssToken => ({
      id,
      localID: `--ws-${id.replaceAll('.', '-')}`,
      value,
    })
    const base = [
      token('space.4', '0.25rem'),
      token('space.16', '1rem'),
      token('motion.easing.standard', 'cubic-bezier(0.2, 0, 0, 1)'),
      token('motion.duration.fast', '120ms'),
    ]

    it('takes a token added to a group it maps, with no change to the mapping', () => {
      const written = tailwindTheme([
        ...base,
        token('color.interactive-hover', '#acdfe8'),
        token('size.control', '2.5rem'),
        token('text.tagline', {
          'font-size': '1.25rem',
          'line-height': '1.5',
          'letter-spacing': '0rem',
          'font-weight': '500',
          'font-family': 'var(--ws-font-family-sans)',
        }),
      ])
      expect(written).toContain('--color-interactive-hover: var(--ws-color-interactive-hover);')
      expect(written).toContain('--spacing-control: var(--ws-size-control);')
      expect(written).toContain('--text-tagline--font-weight: var(--ws-text-tagline-font-weight);')
    })

    it('fails on a group it neither maps nor leaves out, so a new group is a decision', () => {
      expect(() => tailwindTheme([...base, token('elevation.1', '2px')])).toThrow(/elevation\.1/)
    })

    it('fails on a space that is not on Tailwind’s scale of four pixels to a step', () => {
      expect(() => tailwindTheme([...base, token('space.10', '0.7rem')])).toThrow(/space\.10/)
    })
  })
})

describe('the Tailwind entry', () => {
  it('imports what index.css imports, each in its layer, between Tailwind’s own', () => {
    const entry = read('dist/tailwind.css')
    const imports = [...entry.matchAll(/^@import .+;$/gm)].map(([line]) => line)
    const layers: Record<string, string> = { tokens: 'theme', icons: 'theme', base: 'base' }
    const sheets = [...read('src/css/index.css').matchAll(/@import '(.+)\/(\w+)\.css'/g)].map(
      ([, dir, name]) => {
        const path = dir === '.' ? `./css/${name}.css` : `./${name}.css`
        return name === 'fonts'
          ? `@import '${path}';`
          : `@import '${path}' layer(${layers[name!] ?? 'components'});`
      },
    )
    expect(sheets).toContain("@import './tokens.css' layer(theme);")
    expect(imports).toEqual([
      "@import 'tailwindcss/theme.css' layer(theme);",
      "@import 'tailwindcss/preflight.css' layer(base);",
      ...sheets,
      "@import 'tailwindcss/utilities.css' layer(utilities);",
      "@import './tailwind/theme.css';",
      "@import './tailwind/variants.css';",
    ])
    expect(entry).toContain('@layer theme, base, components, utilities;')
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
