import { BUBBLE_ADVANCE, BUBBLE_GLYPHS } from './glyphs.ts'
import { svgElement } from './svg.ts'

/** Height of the bubble's body, and of the tail under or over it, in font pixels. */
const BODY = 15
const TAIL = 3
/** Empty font pixels left and right of the text. */
const PADDING = 3

export type BubbleSide = 'above' | 'below'

/** Width and height of the bubble for a text, in font pixels. */
export function bubbleSize(text: string): { width: number; height: number } {
  return { width: [...text].length * BUBBLE_ADVANCE + 2 * PADDING, height: BODY + TAIL }
}

/** How many letters fit a bubble that may be `width` font pixels wide. */
export function lettersThatFit(width: number): number {
  return Math.floor((width - 2 * PADDING) / BUBBLE_ADVANCE)
}

/** Furthest the tail can move right, in font pixels. */
export const maxTailShift = (text: string) => bubbleSize(text).width - 7

/**
 * A pixel speech bubble with stepped corners, as an SVG element built without markup.
 * `unit` is the size of one font pixel. The tail points down when the bubble sits above the
 * speaker and up when it sits below, and `tailShift` moves it right, in font pixels.
 */
export function bubbleElement(
  text: string,
  unit: number,
  side: BubbleSide,
  tailShift = 0,
  document: Document = globalThis.document,
): SVGSVGElement {
  const { width, height } = bubbleSize(text)
  const top = side === 'below' ? TAIL : 0
  // three steps, narrowing toward the speaker
  const steps =
    side === 'below'
      ? [
          [3, top - 1, 3],
          [2, top - 2, 2],
          [1, top - 3, 1],
        ]
      : [
          [3, BODY, 3],
          [2, BODY + 1, 2],
          [1, BODY + 2, 1],
        ]
  const shape =
    `M1 ${top}h${width - 2}v1h1v${BODY - 2}h-1v1h${2 - width}v-1h-1v${2 - BODY}h1z` +
    steps.map(([x, y, run]) => `M${x! + tailShift} ${y}h${run}v1h${-run!}z`).join('')
  const letters = svgElement(document, 'g', { class: 'ws-ghost__bubble-text' })
  letters.append(
    ...[...text].map((char, index) => {
      const glyph = BUBBLE_GLYPHS[char]
      if (!glyph) throw new Error(`The speech bubble has no glyph for "${char}"`)
      return svgElement(document, 'path', {
        d: glyph,
        transform: `translate(${PADDING + index * BUBBLE_ADVANCE} ${top + 11})`,
      })
    }),
  )
  const svg = svgElement(document, 'svg', {
    viewBox: `0 0 ${width} ${height}`,
    width: String(width * unit),
    height: String(height * unit),
    'shape-rendering': 'crispEdges',
  })
  svg.append(svgElement(document, 'path', { class: 'ws-ghost__bubble-shape', d: shape }), letters)
  return svg
}
