import { readFileSync } from 'node:fs'
import { variants } from '@rose-pine/palette'
import { describe, expect, it } from 'vitest'
import { hex, tokens } from '../scripts/lib/tokens.ts'

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

describe('the palette', () => {
  it.each(['main', 'dawn'] as const)('has the official Rosé Pine %s colors', (variant) => {
    for (const [name, color] of Object.entries(variants[variant].colors)) {
      const id = `palette.${variant}.${kebab(name)}` as Parameters<typeof hex>[0]
      expect(hex(id), id).toBe(`#${color.hex}`)
    }
  })

  it('writes each color as components and as the hex they make', () => {
    const { palette } = JSON.parse(read('tokens/palette.tokens.json'))
    for (const variant of ['main', 'dawn']) {
      for (const [name, token] of Object.entries<{ $value: { components: number[]; hex: string } }>(
        palette[variant],
      )) {
        if (name.startsWith('$')) continue
        const fromComponents = token.$value.components
          .map((component) =>
            Math.round(component * 255)
              .toString(16)
              .padStart(2, '0'),
          )
          .join('')
        expect(`#${fromComponents}`, `${variant}.${name}`).toBe(token.$value.hex)
      }
    }
  })

  it('keeps the Rosé Pine copyright line with the values', () => {
    expect(JSON.parse(read('tokens/palette.tokens.json')).palette.$description).toContain(
      'Copyright (c) mvllow',
    )
    expect(read('dist/tokens.css')).toContain('Copyright (c) mvllow, MIT License')
    expect(read('licenses/rose-pine-palette.LICENSE')).toContain('Copyright (c) mvllow')
  })
})

describe('the color roles', () => {
  it('are the same set in both themes', () => {
    const roles = (theme: 'dark' | 'light') =>
      Object.keys(tokens(theme)).filter((id) => id.startsWith('color.'))
    expect(roles('light')).toEqual(roles('dark'))
  })

  // A tint is written out with its alpha, so nothing ties it to its hue but this test.
  it.each([
    ['color.tag-bg', 'color.interactive'],
    ['color.tip-tint', 'color.tip'],
    ['color.note-tint', 'color.note'],
    ['color.warning-tint', 'color.warning'],
    ['color.danger-tint', 'color.danger'],
  ] as const)('%s is a tint of %s', (tint, hue) => {
    for (const theme of ['dark', 'light'] as const) {
      const of = (id: typeof tint | typeof hue) => tokens(theme)[id].$value
      expect(of(tint).components, theme).toEqual(of(hue).components)
      expect(of(tint).alpha, theme).toBeLessThan(1)
    }
  })

  it('keeps code blocks and the mark on the dark palette in both themes', () => {
    for (const id of [
      'code.bg',
      'code.text',
      'syntax.keyword',
      'mark.tile',
      'mark.body',
      'mark.tongue',
    ] as const)
      expect(hex(id, 'light'), id).toBe(hex(id, 'dark'))
    expect(hex('code.bg')).toBe(hex('palette.main.surface'))
    expect(hex('mark.tongue')).toBe(hex('palette.main.love'))
  })
})

describe('the stylesheet', () => {
  const css = read('dist/tokens.css')

  it('is dark by default, light when the system asks, and overridable by hand', () => {
    expect(css).toMatch(/:root,\n\[data-theme='dark'\] \{\n {2}color-scheme: dark;/)
    expect(css).toMatch(/\[data-theme='light'\] \{\n {2}color-scheme: light;/)
    expect(css).toMatch(
      /@media \(prefers-color-scheme: light\) \{\n {2}:root:not\(\[data-theme\]\) \{/,
    )
  })

  it('defines every role in every theme block', () => {
    const roles = Object.keys(tokens('dark')).filter((id) => id.startsWith('color.'))
    for (const role of roles) {
      const declarations = css.match(new RegExp(`--ws-${role.replaceAll('.', '-')}:`, 'g')) ?? []
      // once for dark, once for the light attribute, once for the light media query
      expect(declarations, role).toHaveLength(3)
    }
  })

  it('writes colors as hex, the exact Rosé Pine values', () => {
    expect(css).toContain('--ws-palette-main-base: #191724;')
    expect(css).toContain('--ws-palette-dawn-base: #faf4ed;')
    expect(css).not.toMatch(/oklch|rgb\(/)
  })
})
