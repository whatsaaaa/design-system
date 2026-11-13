// Builds the asset kit of one identity: the handle with its ghost, or a project with its sprite.
// Also reads a project's file and writes a kit to its folder.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  type MarkColors,
  type MarkCut,
  markBody,
  markSvg,
  rasterMarkSvg,
  svgDocument,
} from '../../src/identity/marks.ts'
import { type Sprite, checkSprite } from '../../src/identity/sprite.ts'
import { type BannerColors, terminalBanner } from './banner.ts'
import { jetBrainsMono } from './outline.ts'
import { renderIco, renderPng } from './raster.ts'
import { hex } from './tokens.ts'

export interface Identity {
  name: string
  /** One line about it, shown in the banners. */
  tagline: string
  banner?: {
    /** Window title. Defaults to the project's folder under the handle. */
    title?: string
    /** The command whose output is the name. Defaults to reading the README. */
    command?: string
    /** Index of the first letter of the name drawn in love. */
    loveFrom?: number
  }
  /** `ghost` is the handle's own mark, `project` a sprite of the family. */
  kind: 'ghost' | 'project'
  /** The mark. For the ghost, its idle pose. */
  sprite: Sprite
  /** More poses of the ghost, by name. */
  poses?: Record<string, Sprite>
}

export interface KitFile {
  /** Path inside the kit, starting with the identity's name. */
  path: string
  content: string | Buffer
  /** What the file is for, in a few words. */
  use: string
  width: number
  height: number
}

/** A project file: a name, a tagline and a sprite, with the banner's command if it has one. */
export function readProject(file: string): Identity {
  const project = JSON.parse(readFileSync(file, 'utf8'))
  for (const key of ['name', 'tagline', 'sprite'])
    if (!(key in project)) throw new Error(`${file} has no "${key}"`)
  return { ...project, kind: 'project' }
}

/**
 * Writes a kit, as paths and their content, as everything a folder holds. The folder is
 * replaced as a whole, so what the sources no longer produce does not linger in it.
 */
export function writeKit(out: string, kit: Map<string, string | Buffer>): void {
  rmSync(out, { recursive: true, force: true })
  for (const [file, content] of kit) {
    mkdirSync(dirname(join(out, file)), { recursive: true })
    writeFileSync(join(out, file), content)
  }
}

const HANDLE = 'whatsaaaa'

const markColors = (): MarkColors => ({
  tile: hex('mark.tile'),
  dark: { body: hex('mark.body'), love: hex('mark.tongue') },
  light: { body: hex('color.text', 'light'), love: hex('color.brand', 'light') },
})

const bannerColors = (): BannerColors => ({
  page: hex('color.bg'),
  window: hex('color.surface'),
  border: hex('color.border'),
  text: hex('color.text'),
  dim: hex('color.text-secondary'),
  love: hex('color.brand'),
  lights: [hex('color.danger'), hex('color.warning'), hex('color.tip')],
})

const path = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`

/** Every file of one identity's kit. Throws when the sprite breaks the family's rules. */
export async function buildKit(identity: Identity): Promise<KitFile[]> {
  const { name, kind, sprite } = identity
  for (const [label, rows] of [
    ['sprite', sprite] as const,
    ...Object.entries(identity.poses ?? {}),
  ]) {
    const problems = checkSprite(rows, kind)
    if (problems.length > 0) throw new Error(`The ${label} of ${name} ${problems.join(', and ')}.`)
  }

  const colors = markColors()
  const fonts = { text: jetBrainsMono(500), name: jetBrainsMono(800) }
  const monoLove = kind === 'ghost' ? 'hole' : 'ink'
  const text = { dark: hex('color.text'), light: hex('color.text', 'light') }
  const files: KitFile[] = []
  const add = (
    file: string,
    content: string | Buffer,
    use: string,
    width: number,
    height: number,
  ) => files.push({ path: `${name}/${file}`, content, use, width, height })

  /* the mark in its cuts */
  const cuts: [MarkCut, string, string][] = [
    ['tile', 'mark.svg', 'The mark on its tile. Avatars and anywhere the background is unknown.'],
    ['on-dark', 'mark-on-dark.svg', 'The free mark for dark backgrounds.'],
    ['on-light', 'mark-on-light.svg', 'The free mark for light backgrounds.'],
    ['mono', 'mark-mono.svg', 'The free mark in one color, taken from the text color around it.'],
  ]
  for (const [cut, file, use] of cuts)
    add(file, markSvg(sprite, `${name} mark`, { cut, colors, monoLove }), use, 64, 64)

  /* wordmark and lockups */
  for (const mode of ['dark', 'light'] as const) {
    const word = fonts.name.outline(name, { size: 50, tracking: -25 })
    const height = Math.ceil(word.bottom - word.top)
    add(
      `wordmark-${mode}.svg`,
      svgDocument(
        Math.ceil(word.width),
        height,
        `<g transform="translate(0 ${Math.round(-word.top * 100) / 100})">${path(word.d, text[mode])}</g>`,
        name,
      ),
      `The name alone, for ${mode} backgrounds.`,
      Math.ceil(word.width),
      height,
    )
    const lockup = fonts.name.outline(name, { x: 84, y: 46, size: 50, tracking: -25 })
    add(
      `lockup-${mode}.svg`,
      svgDocument(
        Math.ceil(lockup.x1),
        64,
        markBody(sprite, { cut: 'tile', colors, monoLove }) + path(lockup.d, text[mode]),
        name,
      ),
      `The mark and the name, for ${mode} backgrounds.`,
      Math.ceil(lockup.x1),
      64,
    )
  }

  /* poses of the ghost */
  for (const [pose, rows] of Object.entries(identity.poses ?? {})) {
    for (const mode of ['dark', 'light'] as const)
      add(
        `pose-${pose}-${mode}.svg`,
        markSvg(rows, `${name} ghost, ${pose}`, { cut: `on-${mode}`, colors, monoLove }),
        `The ghost in its ${pose} pose, for ${mode} backgrounds.`,
        64,
        64,
      )
  }

  /* favicon set */
  const png = (size: number, square = false) =>
    renderPng(rasterMarkSvg(sprite, size, colors, { square }))
  add(
    'favicon.svg',
    markSvg(sprite, name, { cut: 'tile', colors, monoLove }),
    'Favicon for browsers that take SVG.',
    64,
    64,
  )
  add(
    'favicon.ico',
    await renderIco([png(16), png(32), png(48)]),
    'Favicon for everything else: 16, 32 and 48 px.',
    48,
    48,
  )
  add('favicon-16.png', png(16), 'Favicon, 16 px.', 16, 16)
  add('favicon-32.png', png(32), 'Favicon, 32 px.', 32, 32)
  add(
    'apple-touch-icon.png',
    png(180, true),
    'Home screen icon for iOS, square because iOS rounds it.',
    180,
    180,
  )
  add('icon-192.png', png(192), 'Icon for a web app manifest.', 192, 192)
  add('icon-512.png', png(512), 'Icon for a web app manifest.', 512, 512)

  /* banners */
  const banner = (bannerKind: 'readme' | 'social') =>
    terminalBanner({
      kind: bannerKind,
      name,
      title: identity.banner?.title ?? `${HANDLE}: ~/${name}`,
      command: identity.banner?.command ?? 'cat README.md',
      comment: identity.tagline,
      loveFrom: identity.banner?.loveFrom,
      sprite,
      colors: bannerColors(),
      fonts,
    })
  const readme = banner('readme')
  add('readme-header.svg', readme, 'Header for a README.', 1280, 320)
  add(
    'readme-header.png',
    renderPng(readme, 2560),
    'The README header as an image, at twice its size.',
    2560,
    640,
  )
  const social = banner('social')
  add('social-card.svg', social, 'Social card.', 1280, 640)
  add(
    'social-card.png',
    renderPng(social),
    'Social card as an image, the size link previews ask for.',
    1280,
    640,
  )

  return files
}
