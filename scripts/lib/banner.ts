// The terminal banner: a window, a command, and the name as its output, with the sprite beside it.
import { svgDocument } from '../../src/identity/marks.ts'
import { type Sprite, spriteBounds, spritePaths } from '../../src/identity/sprite.ts'
import type { Typeface } from './outline.ts'

export interface BannerColors {
  page: string
  window: string
  border: string
  text: string
  dim: string
  love: string
  lights: [string, string, string]
}

export interface BannerOptions {
  /** `readme` is 1280 x 320 with the window filling it, `social` 1280 x 640 with the window on a page. */
  kind: 'readme' | 'social'
  name: string
  /** Window title. */
  title: string
  command: string
  /** Shown after the command as a shell comment. */
  comment: string
  /** Index of the first letter of the name drawn in love. Leave out to draw the name in one color. */
  loveFrom?: number
  sprite: Sprite
  colors: BannerColors
  fonts: { text: Typeface; name: Typeface }
}

const WIDTH = 1280
const round = (value: number) => Math.round(value * 100) / 100
const path = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`

export function terminalBanner(options: BannerOptions): string {
  const { kind, name, colors, fonts } = options
  const social = kind === 'social'
  const height = social ? 640 : 320
  // the window, inset on the social card
  const inset = social ? { x: 72, y: 64 } : { x: 0, y: 0 }
  const win = {
    x: inset.x,
    y: inset.y,
    width: WIDTH - 2 * inset.x,
    height: height - 2 * inset.y,
    radius: social ? 20 : 24,
    bar: social ? 56 : 48,
  }
  const pad = social ? 56 : 48
  const left = win.x + pad

  let body = social ? `<rect width="${WIDTH}" height="${height}" fill="${colors.page}"/>` : ''
  body +=
    `<rect x="${win.x}" y="${win.y}" width="${win.width}" height="${win.height}" rx="${win.radius}" fill="${colors.window}"/>` +
    `<rect x="${win.x + 0.75}" y="${win.y + 0.75}" width="${win.width - 1.5}" height="${win.height - 1.5}" rx="${win.radius - 0.75}" fill="none" stroke="${colors.border}" stroke-width="1.5"/>` +
    `<path d="M${win.x} ${win.y + win.bar}H${win.x + win.width}" stroke="${colors.border}" stroke-width="1.5"/>`
  colors.lights.forEach((light, index) => {
    body += `<circle cx="${win.x + 32 + index * 24}" cy="${win.y + win.bar / 2}" r="7" fill="${light}"/>`
  })
  body += path(
    fonts.text.outline(options.title, {
      x: win.x + win.width / 2,
      y: win.y + win.bar / 2 + 6,
      size: 18,
      anchor: 'middle',
    }).d,
    colors.dim,
  )

  // the sprite, on whole pixels at the right of the window
  const px = social ? 18 : 13
  const artX = Math.round(win.x + win.width - pad - 13 * px)
  const artY = Math.round(win.y + win.bar + (win.height - win.bar - 16 * px) / 2)
  const art = spritePaths(options.sprite, { px, x: artX, y: artY })
  const room = artX - 2 * px - left

  const chevron = (x: number, y: number, size: number) =>
    `<path d="M${round(x + 2)} ${round(y - size * 0.62)} l${round(size * 0.32)} ${round(size * 0.3)} l${round(-size * 0.32)} ${round(size * 0.3)}" fill="none" stroke="${colors.love}" stroke-width="${round(size * 0.15)}" stroke-linecap="round" stroke-linejoin="round"/>`

  // first prompt: the command and the tagline as a comment, a little smaller if that makes it fit
  const base = social ? 28 : 22
  const line1 = win.y + win.bar + (social ? 76 : 50)
  const firstLine = (size: number) => {
    const command = fonts.text.outline(options.command, { x: left + size * 0.95, y: line1, size })
    const comment = fonts.text.outline(`# ${options.comment}`, {
      x: command.x1 + size * 0.9,
      y: line1,
      size,
    })
    return { command, comment }
  }
  const lineEnd = win.x + win.width - pad
  const natural = firstLine(base).comment.x1 - left
  const small = Math.min(base, Math.floor(((lineEnd - left) / natural) * base * 2) / 2)
  const { command, comment } = firstLine(small)
  // the line may run on above the sprite, as long as it clears the sprite's own pixels
  const drawn = spriteBounds(options.sprite)
  const overSprite =
    comment.x1 > artX + drawn.x * px - px && artY + drawn.y * px < line1 + small * 0.3
  if (overSprite || small < base * 0.8)
    throw new Error(
      `The command and tagline of ${name} do not fit the ${kind} banner: ` +
        (overSprite ? 'they run into the sprite' : 'they are too long for one line') +
        '. Shorten the tagline.',
    )
  body += chevron(left, line1, small) + path(command.d, colors.text) + path(comment.d, colors.dim)

  // the output: the name, as large as the room left of the sprite allows
  const unit = fonts.name.outline(name, { size: 100, tracking: -25 }).width
  const size = Math.min(social ? 132 : 96, Math.floor((room / unit) * 100))
  const line2 = line1 + (social ? 168 : 112)
  const word = fonts.name.outline(name, { x: left, y: line2, size, tracking: -25 })
  const cut = options.loveFrom ?? word.parts.length
  const join = (parts: typeof word.parts) => parts.map((part) => part.d).join('')
  body += path(join(word.parts.slice(0, cut)), colors.text)
  if (cut < word.parts.length) body += path(join(word.parts.slice(cut)), colors.love)

  // second prompt: a cursor, waiting
  const line3 = line2 + (social ? 96 : 62)
  body +=
    chevron(left, line3, small) +
    `<rect x="${round(left + small * 0.95)}" y="${round(line3 - small * 0.86)}" width="${round(small * 0.58)}" height="${round(small * 1.1)}" rx="2" fill="${colors.text}"/>`

  body +=
    `<g shape-rendering="crispEdges">` +
    (art.body ? path(art.body, colors.text) : '') +
    (art.love ? path(art.love, colors.love) : '') +
    `</g>`

  return svgDocument(WIDTH, height, body, `${name} ${social ? 'social card' : 'README header'}`)
}
