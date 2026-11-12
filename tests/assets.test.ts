import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { jetBrainsMono } from '../scripts/lib/outline.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const generate = (...args: string[]) =>
  execFileSync(process.execPath, ['scripts/generate-assets.ts', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
  })

const scratch = mkdtempSync(join(tmpdir(), 'ws-assets-'))
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

const sprite = [
  '................',
  '................',
  '..BBBBBBBBBBBB..',
  '..BBBBBBBBBBBB..',
  '..BB........BB..',
  '..BB........BB..',
  '..BBBBBBBBBBBB..',
  '..BBBBBBBBBBBB..',
  '................',
  '......TTTT......',
  '......TTTT......',
  '.......TT.......',
  '................',
  '................',
  '................',
  '................',
]

describe('the asset kit', () => {
  it('in assets/ is what the sources produce', () => {
    expect(generate('--check')).toContain('assets/ is up to date')
  })

  it('has every kind of file for the handle and for each project', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'assets/manifest.json'), 'utf8')).identities
    expect(Object.keys(manifest)).toEqual([
      'whatsaaaa',
      'building-blocks',
      'dotfiles',
      'form-builder',
    ])
    const shared = [
      'mark.svg',
      'mark-on-dark.svg',
      'mark-on-light.svg',
      'mark-mono.svg',
      'wordmark-dark.svg',
      'wordmark-light.svg',
      'lockup-dark.svg',
      'lockup-light.svg',
      'favicon.svg',
      'favicon.ico',
      'favicon-16.png',
      'favicon-32.png',
      'apple-touch-icon.png',
      'icon-192.png',
      'icon-512.png',
      'readme-header.svg',
      'readme-header.png',
      'social-card.svg',
      'social-card.png',
    ]
    for (const [identity, files] of Object.entries<{ file: string }[]>(manifest)) {
      const names = files.map((entry) => entry.file)
      expect(names, identity).toEqual(expect.arrayContaining(shared))
      expect(
        names.filter((name) => name.startsWith('pose-')),
        identity,
      ).toHaveLength(identity === 'whatsaaaa' ? 12 : 0)
    }
  })

  it('writes PNGs at the sizes it says', () => {
    const size = (file: string) => {
      const png = readFileSync(join(root, 'assets', file))
      return [png.readUInt32BE(16), png.readUInt32BE(20)]
    }
    expect(size('whatsaaaa/favicon-16.png')).toEqual([16, 16])
    expect(size('whatsaaaa/apple-touch-icon.png')).toEqual([180, 180])
    expect(size('whatsaaaa/icon-512.png')).toEqual([512, 512])
    expect(size('form-builder/social-card.png')).toEqual([1280, 640])
    expect(size('form-builder/readme-header.png')).toEqual([2560, 640])
  })

  it('has no text that needs a font: every SVG is paths', () => {
    for (const identity of ['whatsaaaa', 'form-builder']) {
      for (const file of readdirSync(join(root, 'assets', identity)).filter((name) =>
        name.endsWith('.svg'),
      )) {
        const svg = readFileSync(join(root, 'assets', identity, file), 'utf8')
        expect(svg, file).not.toMatch(/<text|font-family|NaN/)
      }
    }
  })
})

describe('a new project', () => {
  it('gets the whole kit from its name and sprite', () => {
    const file = join(scratch, 'kafana.json')
    writeFileSync(
      file,
      JSON.stringify({ name: 'kafana', tagline: 'rezervacije za Čačak i Niš', sprite }),
    )
    const out = join(scratch, 'brand')
    expect(generate('--project', file, '--out', out)).toContain('wrote 20 files')
    const files = readdirSync(join(out, 'kafana'))
    expect(files).toEqual(
      expect.arrayContaining(['mark.svg', 'favicon.ico', 'readme-header.svg', 'social-card.png']),
    )
    expect(files.some((name) => name.startsWith('pose-'))).toBe(false)
    const header = readFileSync(join(out, 'kafana/readme-header.svg'), 'utf8')
    expect(header).toContain('aria-label="kafana README header"')
    expect(header).not.toContain('NaN')
    // nothing of the repository's own kit is touched
    expect(generate('--check')).toContain('assets/ is up to date')
  })

  it('is refused when its sprite breaks the rules, with the reason', () => {
    const file = join(scratch, 'broken.json')
    const noLove = sprite.map((row) => row.replaceAll('T', '.'))
    writeFileSync(file, JSON.stringify({ name: 'broken', tagline: 'nothing', sprite: noLove }))
    expect(() => generate('--project', file, '--out', join(scratch, 'broken'))).toThrow(
      /The sprite of broken has 0 love elements \(T\), needs exactly one/,
    )
  })

  it('is refused when its tagline does not fit the banner', () => {
    const file = join(scratch, 'long.json')
    writeFileSync(file, JSON.stringify({ name: 'long', tagline: 'a tagline '.repeat(12), sprite }))
    expect(() => generate('--project', file, '--out', join(scratch, 'long'))).toThrow(
      /do not fit the readme banner.*Shorten the tagline/,
    )
  })

  it('needs a name, a tagline and a sprite', () => {
    const file = join(scratch, 'nameless.json')
    writeFileSync(file, JSON.stringify({ tagline: 'x', sprite }))
    expect(() => generate('--project', file, '--out', join(scratch, 'nameless'))).toThrow(
      /has no "name"/,
    )
  })
})

describe('text as outlines', () => {
  const face = jetBrainsMono(800)

  it('draws Serbian Latin from the latin-ext subset', () => {
    const outlined = face.outline('čćšžđ ČĆŠŽĐ', { size: 50 })
    expect(outlined.parts).toHaveLength(11)
    expect(outlined.d).not.toContain('NaN')
    for (const part of outlined.parts.filter((entry) => entry.char !== ' '))
      expect(part.d).not.toBe('')
  })

  it('fails loudly on a character the font does not have, instead of drawing a box', () => {
    expect(() => face.outline('日本')).toThrow('JetBrains Mono 800 has no glyph for "日" (U+65E5)')
  })

  it('places text by its anchor and reports its box', () => {
    const start = face.outline('whatsaaaa', { x: 100, size: 50, tracking: -25 })
    const middle = face.outline('whatsaaaa', { x: 100, size: 50, tracking: -25, anchor: 'middle' })
    const end = face.outline('whatsaaaa', { x: 100, size: 50, tracking: -25, anchor: 'end' })
    expect(start.x0).toBe(100)
    expect(middle.x0).toBeCloseTo(100 - start.width / 2)
    expect(end.x1).toBeCloseTo(100)
    // a mono face: nine letters of 600 units at 50 px, less the tracking between them
    expect(start.width).toBeCloseTo(9 * 30 - 8 * 1.25)
    expect(start.top).toBeLessThan(0)
    expect(start.bottom).toBeGreaterThanOrEqual(0)
  })
})
