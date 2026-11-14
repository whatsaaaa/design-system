// Writes the head scripts as files, for a page that would rather load them than inline them:
// dist/theme/init.js applies a remembered theme and keeps the browser's theme-color in step
// with the theme shown, dist/shortcuts/init.js marks the keys off when they are remembered as
// off, and pending until the shortcuts module runs. They are plain scripts, not modules, so
// they can run before the first paint: <script src=".../theme/init.js"></script>, before the
// stylesheet.
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { keysInitScript } from '../src/shortcuts/index.ts'
import { themeInitScript } from '../src/theme/index.ts'

const dist = join(resolve(import.meta.dirname, '..'), 'dist')

for (const [file, script, does] of [
  [
    'theme/init.js',
    themeInitScript,
    'Applies a remembered theme before the first paint, and keeps theme-color in step with the theme shown.',
  ],
  [
    'shortcuts/init.js',
    keysInitScript,
    'Marks the keys before the first paint: off when they are remembered as off, and pending until the shortcuts module runs.',
  ],
] as const) {
  const source = `src/${file.replace('init.js', 'index.ts')}`
  writeFileSync(join(dist, file), `// ${does} Generated from ${source}.\n${script}\n`)
  console.log(`wrote dist/${file}`)
}
