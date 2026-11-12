// Writes dist/theme/init.js: the theme's head script as a file, for a page that would
// rather load it than inline it. It is a plain script, not a module, so it can run before
// the first paint: <script src=".../theme/init.js"></script>, before the stylesheet.
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { themeInitScript } from '../src/theme/index.ts'

const file = join(resolve(import.meta.dirname, '..'), 'dist/theme/init.js')
writeFileSync(
  file,
  `// Applies a remembered theme before the first paint. Generated from src/theme/index.ts.\n${themeInitScript}\n`,
)
console.log('wrote dist/theme/init.js')
