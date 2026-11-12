// Renders generated SVG to PNG and ICO.
import { Resvg } from '@resvg/resvg-js'
import pngToIco from 'png-to-ico'

/**
 * Renders an SVG to PNG, at its own size or scaled to `width`.
 * resvg draws the same pixels on every platform, so a rerun elsewhere gives the same file.
 */
export function renderPng(svg: string, width?: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: width === undefined ? { mode: 'original' } : { mode: 'width', value: width },
    // every generated SVG has its text as paths
    font: { loadSystemFonts: false },
  })
  return resvg.render().asPng()
}

/** Packs PNGs into one ICO, an image per size. */
export function renderIco(pngs: Buffer[]): Promise<Buffer> {
  return pngToIco(pngs)
}
