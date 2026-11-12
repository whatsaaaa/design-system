import { type Sprite, spritePaths } from './sprite.ts'

/** Marks are drawn in a 64 x 64 box: four units per sprite pixel. */
export const MARK_BOX = 64
/** Corner radius of the tile in that box. */
export const TILE_RADIUS = 14

/**
 * The cuts of a mark.
 * - `tile`: on its dark rounded tile, the same in both themes. Favicons and avatars.
 * - `on-dark` and `on-light`: free, for a dark or a light background.
 * - `mono`: free, in `currentColor`.
 */
export type MarkCut = 'tile' | 'on-dark' | 'on-light' | 'mono'

export interface MarkColors {
  tile: string
  /** Body and love element on the tile and on dark backgrounds. */
  dark: { body: string; love: string }
  /** Body and love element on light backgrounds. */
  light: { body: string; love: string }
}

export interface MarkOptions {
  cut: MarkCut
  colors: MarkColors
  /**
   * What the love element becomes in one color: a `hole` in the body, as the ghost's tongue
   * sits inside its mouth, or `ink` like the body, as a project's love element stands alone.
   */
  monoLove: 'hole' | 'ink'
}

const path = (d: string, fill: string) => (d ? `<path d="${d}" fill="${fill}"/>` : '')

/** The inside of a mark's `<svg>`: the tile if the cut has one, then the sprite. */
export function markBody(rows: Sprite, { cut, colors, monoLove }: MarkOptions): string {
  const { body, love } = spritePaths(rows, { px: MARK_BOX / 16 })
  const tile =
    cut === 'tile'
      ? `<rect width="${MARK_BOX}" height="${MARK_BOX}" rx="${TILE_RADIUS}" fill="${colors.tile}"/>`
      : ''
  let sprite: string
  if (cut === 'mono') {
    sprite = path(monoLove === 'ink' ? body + love : body, 'currentColor')
  } else {
    const ink = cut === 'on-light' ? colors.light : colors.dark
    sprite = path(body, ink.body) + path(love, ink.love)
  }
  // crisp edges keep sprite pixels sharp at sizes that are not a multiple of 16
  return `${tile}<g shape-rendering="crispEdges">${sprite}</g>`
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A standalone SVG document with a title, so it is announced when used as an image. */
export function svgDocument(width: number, height: number, body: string, title: string): string {
  const label = escape(title)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${label}">` +
    `<title>${label}</title>${body}</svg>\n`
  )
}

/** A mark as a standalone SVG document. */
export function markSvg(rows: Sprite, title: string, options: MarkOptions): string {
  return svgDocument(MARK_BOX, MARK_BOX, markBody(rows, options), title)
}

/**
 * The tile mark drawn for one raster size, on whole pixels.
 * A sprite pixel takes as many screen pixels as fit, and the sprite is centered on the tile.
 * `square` fills the whole image, for the touch icon that iOS masks itself.
 */
export function rasterMarkSvg(
  rows: Sprite,
  size: number,
  colors: MarkColors,
  { square = false }: { square?: boolean } = {},
): string {
  const px = Math.floor(size / 16)
  if (px < 1) throw new Error(`A mark needs at least 16 px, got ${size}`)
  const offset = (size - px * 16) / 2
  if (!Number.isInteger(offset))
    throw new Error(`A ${size} px mark cannot be centered on whole pixels`)
  const radius = square ? 0 : Math.round((size * TILE_RADIUS) / MARK_BOX)
  const { body, love } = spritePaths(rows, { px, x: offset, y: offset })
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" rx="${radius}" fill="${colors.tile}"/>` +
    `<g shape-rendering="crispEdges">${path(body, colors.dark.body)}${path(love, colors.dark.love)}</g></svg>`
  )
}
