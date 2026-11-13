// The terminal banners: a window, a command, and the name as its output, with the sprite beside it.
// The profile banner is the top of such a window, for a profile that prints the name below it.
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

/** The prompt's chevron, in front of a line of text of `size` with its baseline at `y`. */
const chevron = (x: number, y: number, size: number, color: string) =>
  `<path d="M${round(x + 2)} ${round(y - size * 0.62)} l${round(size * 0.32)} ${round(size * 0.3)} l${round(-size * 0.32)} ${round(size * 0.3)}" fill="none" stroke="${color}" stroke-width="${round(size * 0.15)}" stroke-linecap="round" stroke-linejoin="round"/>`

/** The window's three lights, from the left at `x`, centered on `y`. */
const lights = (colors: BannerColors, x: number, y: number, radius: number, step: number) =>
  colors.lights
    .map(
      (light, index) =>
        `<circle cx="${x + index * step}" cy="${y}" r="${radius}" fill="${light}"/>`,
    )
    .join('')

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
  body += lights(colors, win.x + 32, win.y + win.bar / 2, 7, 24)
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
  body +=
    chevron(left, line1, small, colors.love) +
    path(command.d, colors.text) +
    path(comment.d, colors.dim)

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
    chevron(left, line3, small, colors.love) +
    `<rect x="${round(left + small * 0.95)}" y="${round(line3 - small * 0.86)}" width="${round(small * 0.58)}" height="${round(small * 1.1)}" rx="2" fill="${colors.text}"/>`

  body +=
    `<g shape-rendering="crispEdges">` +
    (art.body ? path(art.body, colors.text) : '') +
    (art.love ? path(art.love, colors.love) : '') +
    `</g>`

  return svgDocument(WIDTH, height, body, `${name} ${social ? 'social card' : 'README header'}`)
}

export interface ProfileBannerOptions {
  name: string
  /** Window title. */
  title: string
  /** The command whose output is the profile below the banner. */
  command: string
  colors: BannerColors
  fonts: { text: Typeface }
}

/** The profile banner is 640 x 144, the box Gravatar shows a header image in. */
export const PROFILE_BANNER = { width: 640, height: 144 }

/**
 * Gravatar keeps the header 640 px wide and crops it to the card, so a phone shows only its
 * middle, while the avatar stays at the card's left and sweeps from x 40 on a desktop to x 328
 * on a 360 px phone. Below the title bar, this band is the part every width from 360 px up
 * shows and no avatar covers.
 */
const PROFILE_FREE = { from: 328, to: 484 }

/**
 * The top of a terminal window, for the header of a profile: the title bar, and a command whose
 * output is the profile itself, under it. The avatar takes the left of the header, so the
 * command stands where every crop shows it and no avatar covers it.
 */
export function profileBanner(options: ProfileBannerOptions): string {
  const { name, colors, fonts } = options
  const { width, height } = PROFILE_BANNER
  // the avatar's top is 24 px down on a phone, so the bar ends above it
  const bar = 20
  let body =
    `<rect width="${width}" height="${height}" fill="${colors.window}"/>` +
    `<path d="M0 ${bar - 0.5}H${width}" stroke="${colors.border}"/>` +
    lights(colors, 14, bar / 2, 3.5, 12) +
    path(
      fonts.text.outline(options.title, {
        x: width / 2,
        y: bar / 2 + 3.5,
        size: 10,
        anchor: 'middle',
      }).d,
      colors.dim,
    )

  // the command and the cursor after it, centered in the free band
  const size = 14
  const line = 88
  const indent = size * 0.95
  const cursor = size * 0.58
  const natural = fonts.text.outline(options.command, { size }).width
  const left = Math.round((PROFILE_FREE.from + PROFILE_FREE.to - (indent + natural + cursor)) / 2)
  if (left - PROFILE_FREE.from < size)
    throw new Error(
      `The command of ${name} does not fit the profile banner: ` +
        'a phone would crop it or the avatar cover it. Shorten the command.',
    )
  const command = fonts.text.outline(options.command, { x: left + indent, y: line, size })
  body +=
    chevron(left, line, size, colors.love) +
    path(command.d, colors.text) +
    `<rect x="${round(command.x1 + size * 0.1)}" y="${round(line - size * 0.86)}" width="${round(cursor)}" height="${round(size * 1.1)}" rx="1" fill="${colors.text}"/>`

  return svgDocument(width, height, body, `${name} profile banner`)
}
