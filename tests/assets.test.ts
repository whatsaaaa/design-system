import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { buildKit, readProject, writeKit } from '../scripts/lib/kit.ts'
import { GHOST } from '../src/identity/ghost.ts'
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
      expect(
        names.filter((name) => name.startsWith('profile-banner')),
        identity,
      ).toEqual(identity === 'whatsaaaa' ? ['profile-banner.png'] : [])
      expect(
        names.filter((name) => name.startsWith('ghost-')),
        identity,
      ).toEqual(identity === 'whatsaaaa' ? ['ghost-on-dark.svg', 'ghost-on-light.svg'] : [])
    }
  })

  it('has the ghost without the margin of its grid, as the ghost module draws it', () => {
    for (const mode of ['dark', 'light']) {
      const svg = readFileSync(join(root, `assets/whatsaaaa/ghost-on-${mode}.svg`), 'utf8')
      expect(svg, mode).toContain('viewBox="0 0 20 24" width="20" height="24"')
      // the top row of the dome starts two sprite pixels in, at the left edge of the file's box
      expect(svg, mode).toMatch(/<path d="M4 0h12v2h-12z/)
      expect(svg, mode).toContain('aria-label="whatsaaaa ghost"')
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
    expect(size('whatsaaaa/profile-banner.png')).toEqual([1280, 288])
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
  it('gets the whole kit from its name and sprite', async () => {
    const files = await buildKit({
      kind: 'project',
      name: 'kafana',
      tagline: 'rezervacije za Čačak i Niš',
      sprite,
    })
    const names = files.map((file) => file.path)
    expect(names).toHaveLength(19)
    expect(names).toEqual(
      expect.arrayContaining([
        'kafana/mark.svg',
        'kafana/favicon.ico',
        'kafana/readme-header.svg',
        'kafana/social-card.png',
      ]),
    )
    expect(names.some((name) => name.includes('pose-'))).toBe(false)
    const header = String(files.find((file) => file.path === 'kafana/readme-header.svg')!.content)
    expect(header).toContain('aria-label="kafana README header"')
    expect(header).not.toContain('NaN')
  })

  it('is refused when its sprite breaks the rules, with the reason', async () => {
    const noLove = sprite.map((row) => row.replaceAll('T', '.'))
    await expect(
      buildKit({ kind: 'project', name: 'broken', tagline: 'nothing', sprite: noLove }),
    ).rejects.toThrow(/The sprite of broken has 0 love elements \(T\), needs exactly one/)
  })

  it('is refused when its tagline does not fit the banner', async () => {
    await expect(
      buildKit({ kind: 'project', name: 'long', tagline: 'a tagline '.repeat(12), sprite }),
    ).rejects.toThrow(/do not fit the readme banner.*Shorten the tagline/)
  })

  it('is read from a file with its name, its tagline and its sprite', () => {
    const file = join(scratch, 'kafana.json')
    writeFileSync(file, JSON.stringify({ name: 'kafana', tagline: 'rezervacije', sprite }))
    expect(readProject(file)).toEqual({
      kind: 'project',
      name: 'kafana',
      tagline: 'rezervacije',
      sprite,
    })
  })

  it('needs a name, a tagline and a sprite', () => {
    const file = join(scratch, 'nameless.json')
    writeFileSync(file, JSON.stringify({ tagline: 'x', sprite }))
    expect(() => readProject(file)).toThrow(/has no "name"/)
  })
})

describe('the profile banner', () => {
  const handle = { kind: 'ghost', name: 'whatsaaaa', tagline: 'x', sprite: GHOST } as const

  it('is refused when its command is too long to stay clear of the avatar and the crop', async () => {
    await expect(buildKit({ ...handle, banner: { command: 'cat ~/.profile' } })).rejects.toThrow(
      /command of whatsaaaa does not fit the profile banner.*Shorten the command/,
    )
  })
})

describe('writing the kit', () => {
  it('replaces the folder as a whole, so a project that was renamed leaves nothing behind', () => {
    const out = join(scratch, 'kit')
    writeKit(
      out,
      new Map([
        ['old-name/mark.svg', '<svg/>'],
        ['manifest.json', '{}'],
      ]),
    )
    writeKit(
      out,
      new Map([
        ['new-name/mark.svg', '<svg/>'],
        ['manifest.json', '{}'],
      ]),
    )
    expect(readdirSync(out, { recursive: true }).sort()).toEqual([
      'manifest.json',
      'new-name',
      'new-name/mark.svg',
    ])
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
    expect(start.x0).toBe(100)
    expect(middle.x0).toBeCloseTo(100 - start.width / 2)
    // a mono face: nine letters of 600 units at 50 px, less the tracking between them
    expect(start.width).toBeCloseTo(9 * 30 - 8 * 1.25)
    expect(start.top).toBeLessThan(0)
    expect(start.bottom).toBeGreaterThanOrEqual(0)
  })
})
