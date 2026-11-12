import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  FAMILIES,
  STYLES,
  SUBSETS,
  fontFile,
  rangeCovers,
  unicodeRanges,
} from '../scripts/lib/fonts.ts'

const dist = new URL('../dist/', import.meta.url)
const css = readFileSync(new URL('fonts.css', dist), 'utf8')

/** The letters Serbian Latin adds to basic Latin. */
const SERBIAN = [...'čćšžđČĆŠŽĐ']

describe('the web fonts', () => {
  it.each(FAMILIES)('$family ships a subset that has every Serbian Latin letter', (family) => {
    const ranges = unicodeRanges(family)
    for (const letter of SERBIAN) {
      const subset = SUBSETS.find((name) => rangeCovers(ranges[name]!, letter))
      expect(subset, `${family.family} ${letter}`).toBe('latin-ext')
    }
    for (const letter of 'azAZ09') expect(rangeCovers(ranges.latin!, letter)).toBe(true)
  })

  it.each(FAMILIES)('$family has a face for every style and subset, with its file', (family) => {
    for (const style of STYLES) {
      for (const subset of SUBSETS) {
        const file = fontFile(family, subset, style)
        expect(css).toContain(`url('./fonts/${file}')`)
        expect(existsSync(new URL(`fonts/${file}`, dist)), file).toBe(true)
      }
    }
    const faces = css.match(new RegExp(`font-family: '${family.family}';`, 'g')) ?? []
    expect(faces).toHaveLength(STYLES.length * SUBSETS.length)
    expect(css).toContain(`font-weight: ${family.weights.join(' ')};`)
  })

  it.each(FAMILIES)('$family travels with its license', (family) => {
    const license = readFileSync(new URL(`fonts/${family.license}`, dist), 'utf8')
    expect(license).toContain('SIL OPEN FONT LICENSE Version 1.1')
    expect(license).toMatch(/^Copyright \d{4} The .+ Project Authors/)
  })

  it('reads unicode ranges', () => {
    expect(rangeCovers('U+0100-02BA,U+2020', 'č')).toBe(true)
    expect(rangeCovers('U+0100-02BA,U+2020', '†')).toBe(true)
    expect(rangeCovers('U+0100-02BA,U+2020', 'a')).toBe(false)
  })

  it('names the families the tokens name', () => {
    const tokens = readFileSync(new URL('tokens.css', dist), 'utf8')
    for (const family of FAMILIES) expect(tokens).toContain(`"${family.family}"`)
  })
})
