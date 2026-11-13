// Turns text into SVG path data, so generated artwork needs no font where it is shown.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import opentype from 'opentype.js'

const require = createRequire(import.meta.url)

export interface OutlineOptions {
  /** Where the text starts or is centered, by `anchor`. */
  x?: number
  /** The baseline. */
  y?: number
  size?: number
  /** Extra space between characters, in thousandths of an em. */
  tracking?: number
  anchor?: 'start' | 'middle'
}

export interface Outlined {
  /** Path data of the whole text. */
  d: string
  /** Path data per character, to color parts of a word. */
  parts: { char: string; d: string }[]
  width: number
  /** Left and right edge of the advance widths. */
  x0: number
  x1: number
  /** Top and bottom of the drawn shapes. */
  top: number
  bottom: number
}

const round = (value: number) => Math.round(value * 100) / 100

/**
 * One weight of a family. Fontsource splits a family into subsets, so a typeface holds the
 * files of several and takes each glyph from the first subset that has it.
 */
export class Typeface {
  readonly #name: string
  readonly #fonts: opentype.Font[]

  constructor(name: string, files: string[]) {
    this.#name = name
    this.#fonts = files.map((file) => {
      const bytes = readFileSync(file)
      return opentype.parse(
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      )
    })
  }

  #glyph(char: string): { glyph: opentype.Glyph; unitsPerEm: number } {
    for (const font of this.#fonts) {
      // index 0 is .notdef, the box a font draws for a character it does not have
      if (font.charToGlyphIndex(char) !== 0)
        return { glyph: font.charToGlyph(char), unitsPerEm: font.unitsPerEm }
    }
    const code = char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')
    throw new Error(`${this.#name} has no glyph for "${char}" (U+${code})`)
  }

  outline(
    text: string,
    { x = 0, y = 0, size = 100, tracking = 0, anchor = 'start' }: OutlineOptions = {},
  ): Outlined {
    const glyphs = [...text].map((char) => ({ char, ...this.#glyph(char) }))
    const gap = (tracking / 1000) * size
    const advances = glyphs.map(
      ({ glyph, unitsPerEm }) => ((glyph.advanceWidth ?? 0) / unitsPerEm) * size + gap,
    )
    const width = advances.reduce((sum, advance) => sum + advance, 0) - gap
    const x0 = anchor === 'middle' ? x - width / 2 : x

    let cursor = x0
    let [top, bottom] = [Infinity, -Infinity]
    const parts = glyphs.map(({ char, glyph }, index) => {
      const glyphPath = glyph.getPath(cursor, y, size)
      if (glyphPath.commands.length > 0) {
        const box = glyphPath.getBoundingBox()
        top = Math.min(top, box.y1)
        bottom = Math.max(bottom, box.y2)
      }
      // Serialized here: opentype's own toPathData yields NaN for values a hair off an integer.
      let d = ''
      for (const command of glyphPath.commands) {
        if (command.type === 'M' || command.type === 'L')
          d += `${command.type}${round(command.x)} ${round(command.y)}`
        else if (command.type === 'Q')
          d += `Q${round(command.x1)} ${round(command.y1)} ${round(command.x)} ${round(command.y)}`
        else if (command.type === 'C')
          d += `C${round(command.x1)} ${round(command.y1)} ${round(command.x2)} ${round(command.y2)} ${round(command.x)} ${round(command.y)}`
        else d += 'Z'
      }
      cursor += advances[index]!
      return { char, d }
    })
    return {
      d: parts.map((part) => part.d).join(''),
      parts,
      width,
      x0,
      x1: x0 + width,
      top,
      bottom,
    }
  }
}

/** JetBrains Mono in one weight, with the subsets that cover Serbian Latin. */
export function jetBrainsMono(weight: 500 | 800): Typeface {
  const file = (subset: string) =>
    require.resolve(
      `@fontsource/jetbrains-mono/files/jetbrains-mono-${subset}-${weight}-normal.woff`,
    )
  return new Typeface(`JetBrains Mono ${weight}`, [file('latin'), file('latin-ext')])
}
