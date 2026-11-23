import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { variants } from '@rose-pine/palette'
import { clampChroma, formatHex, oklab, rgb } from 'culori'
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
  // The style guide shows a role's description once, beside its value in both themes.
  it('are the same set in both themes, with one description for both', () => {
    const roles = (theme: 'dark' | 'light') =>
      Object.entries(tokens(theme))
        .filter(([id]) => id.startsWith('color.'))
        .map(([id, token]) => [id, token.$description])
    expect(roles('light')).toEqual(roles('dark'))
  })

  // A tint is written out as the opaque color its hue makes at its strength on the page, so a tag or
  // a callout reads the same on every ground. Nothing ties it to its hue but this test.
  it.each([
    ['color.tag-bg', 'color.interactive', { dark: 0.12, light: 0.1 }],
    ['color.tip-tint', 'color.tip', { dark: 0.09, light: 0.09 }],
    ['color.note-tint', 'color.note', { dark: 0.09, light: 0.09 }],
    ['color.warning-tint', 'color.warning', { dark: 0.09, light: 0.09 }],
    ['color.danger-tint', 'color.danger', { dark: 0.09, light: 0.09 }],
  ] as const)('%s is %s at its strength over the page', (tint, hue, strength) => {
    for (const theme of ['dark', 'light'] as const) {
      const top = rgb(hex(hue, theme))!
      const page = rgb(hex('color.bg', theme))!
      const over = (channel: 'r' | 'g' | 'b') =>
        top[channel] * strength[theme] + page[channel] * (1 - strength[theme])
      const expected = formatHex({ mode: 'rgb', r: over('r'), g: over('g'), b: over('b') })
      expect(hex(tint, theme), theme).toBe(expected)
    }
  })

  // Written out as hex like every role, so nothing ties them to the interactive color but this.
  it.each([
    ['color.interactive-hover', 0.05],
    ['color.interactive-active', 0.1],
  ] as const)(
    '%s is the interactive color %s further from the page in OKLab lightness',
    (id, step) => {
      for (const theme of ['dark', 'light'] as const) {
        const fill = oklab(hex('color.interactive', theme))!
        const page = oklab(hex('color.bg', theme))!
        const away = Math.sign(fill.l - page.l)
        const expected = formatHex(clampChroma({ ...fill, l: fill.l + away * step }, 'oklab'))
        expect(hex(id, theme), theme).toBe(expected)
      }
    },
  )

  // The brand red as small text: love where it reads at 4.5:1, and in light, where it does not,
  // love a step of the hover fill's further from the page.
  it('color.brand-text is love on dark, and on light love 0.05 further from the page', () => {
    expect(hex('color.brand-text', 'dark')).toBe(hex('palette.main.love'))
    const love = oklab(hex('palette.dawn.love'))!
    const page = oklab(hex('color.bg', 'light'))!
    const away = Math.sign(love.l - page.l)
    expect(hex('color.brand-text', 'light')).toBe(
      formatHex(clampChroma({ ...love, l: love.l + away * 0.05 }, 'oklab')),
    )
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

/** Every `$description` of a token file, of its groups and of its tokens, by the path to it. */
function descriptions(node: Record<string, unknown>, path: string[] = []): [string, string][] {
  const own: [string, string][] =
    typeof node.$description === 'string' ? [[path.join('.'), node.$description]] : []
  return [
    ...own,
    ...Object.entries(node)
      .filter(([key, child]) => !key.startsWith('$') && typeof child === 'object' && child !== null)
      .flatMap(([key, child]) => descriptions(child as Record<string, unknown>, [...path, key])),
  ]
}

describe('the token files', () => {
  // the implementations and libraries a description could name: what one draws is its own to say
  const names = ['ui-vue', 'ui-react', 'Nuxt', 'shadcn', 'Radix', 'Reka']

  it(`name none of ${names.join(', ')} in a description`, () => {
    const files = readdirSync(new URL('../tokens', import.meta.url), {
      encoding: 'utf8',
      recursive: true,
    }).filter((file) => file.endsWith('.tokens.json'))
    expect(files).toContain('theme-dark.tokens.json')
    expect(files).toContain(join('components', 'field.tokens.json'))
    const named = new RegExp(names.join('|'), 'i')
    for (const file of files) {
      const found = descriptions(JSON.parse(read(`tokens/${file}`)))
      expect(found, file).not.toHaveLength(0)
      for (const [path, description] of found)
        expect(description, `${file}: ${path}`).not.toMatch(named)
    }
  })
})
