// The web fonts the system ships: which families, which subsets, and where their files come from.
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

/**
 * Subsets shipped, in the order their @font-face rules are written.
 * `latin-ext` carries the Serbian Latin letters č, ć, š, ž and đ. Add `cyrillic` here to ship
 * Serbian Cyrillic too: both packages have it.
 */
export const SUBSETS = ['latin-ext', 'latin'] as const

export interface FontFamily {
  /** The name used in `font-family`. */
  family: string
  /** The Fontsource package the files come from. */
  package: string
  /** File name prefix inside the package. */
  id: string
  /** Lightest and heaviest weight of the variable font. */
  weights: [number, number]
  /** File name of the license in dist/fonts/. */
  license: string
}

export const FAMILIES: FontFamily[] = [
  {
    family: 'JetBrains Mono',
    package: '@fontsource-variable/jetbrains-mono',
    id: 'jetbrains-mono',
    weights: [100, 800],
    license: 'jetbrains-mono.OFL.txt',
  },
  {
    family: 'Inter',
    package: '@fontsource-variable/inter',
    id: 'inter',
    weights: [100, 900],
    license: 'inter.OFL.txt',
  },
]

export const STYLES = ['normal', 'italic'] as const

export const packageDir = (family: FontFamily) =>
  dirname(require.resolve(`${family.package}/package.json`))

export const fontFile = (family: FontFamily, subset: string, style: string) =>
  `${family.id}-${subset}-wght-${style}.woff2`

/** The characters each subset covers, as Fontsource lists them for `unicode-range`. */
export const unicodeRanges = (family: FontFamily): Record<string, string> =>
  require(join(packageDir(family), 'unicode.json'))

/** Whether a `unicode-range` value such as `U+0100-02BA,U+2020` includes a character. */
export function rangeCovers(range: string, char: string): boolean {
  const code = char.codePointAt(0)!
  return range.split(',').some((part) => {
    const [from, to = from] = part.trim().replace(/^U\+/i, '').split('-')
    return code >= parseInt(from!, 16) && code <= parseInt(to!, 16)
  })
}
