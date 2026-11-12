// Copies the web fonts and their licenses into dist/fonts/ and writes dist/fonts.css.
// The font files come from the Fontsource packages, so none are kept in this repository.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { FAMILIES, STYLES, SUBSETS, fontFile, packageDir, unicodeRanges } from './lib/fonts.ts'

const dist = resolve(import.meta.dirname, '../dist')
const fonts = join(dist, 'fonts')
rmSync(fonts, { recursive: true, force: true })
mkdirSync(fonts, { recursive: true })

const rules: string[] = []
for (const family of FAMILIES) {
  const ranges = unicodeRanges(family)
  // each font travels with its license
  copyFileSync(join(packageDir(family), 'LICENSE'), join(fonts, family.license))
  for (const style of STYLES) {
    for (const subset of SUBSETS) {
      const file = fontFile(family, subset, style)
      copyFileSync(join(packageDir(family), 'files', file), join(fonts, file))
      rules.push(
        `/* ${family.family}, ${style}, ${subset} */\n` +
          `@font-face {\n` +
          `  font-family: '${family.family}';\n` +
          `  font-style: ${style};\n` +
          `  font-weight: ${family.weights.join(' ')};\n` +
          `  font-display: swap;\n` +
          `  src: url('./fonts/${file}') format('woff2-variations');\n` +
          `  unicode-range: ${ranges[subset]};\n` +
          `}`,
      )
    }
  }
}

const notice = `/*
 * JetBrains Mono and Inter as variable fonts, self-hosted.
 * Both are licensed under the SIL Open Font License 1.1. The licenses are next to the files, in fonts/.
 * A browser downloads a subset only when the page has characters from it.
 */`
writeFileSync(join(dist, 'fonts.css'), `${notice}\n\n${rules.join('\n\n')}\n`)
console.log(`wrote ${rules.length} font faces to dist/fonts.css`)
