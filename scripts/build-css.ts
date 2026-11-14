// Bundles the stylesheets in src/css/ into dist/: each one on its own in dist/css/, and all
// of them with the fonts and tokens in dist/index.css. Needs dist/tokens.css,
// dist/theme-rules.css and dist/fonts.css.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { bundle } from 'lightningcss'

const root = resolve(import.meta.dirname, '..')
const source = join(root, 'src/css')
const dist = join(root, 'dist')

// The oldest browsers the output is written for. Newer syntax in the sources, such as
// nesting and range media queries, is rewritten for them.
const targets = {
  chrome: 111 << 16,
  firefox: 115 << 16,
  safari: (16 << 16) | (4 << 8),
}

function build(file: string): Uint8Array {
  const { code, warnings } = bundle({
    filename: join(source, file),
    drafts: { customMedia: true },
    targets,
    minify: false,
  })
  for (const warning of warnings) console.warn(`${file}: ${warning.message}`)
  return code
}

rmSync(join(dist, 'css'), { recursive: true, force: true })
mkdirSync(join(dist, 'css'), { recursive: true })

// breakpoints.css only declares a custom media query, which leaves nothing to ship
const sheets = readdirSync(source)
  .filter((file) => file.endsWith('.css') && !['index.css', 'breakpoints.css'].includes(file))
  .sort()
for (const file of sheets) writeFileSync(join(dist, 'css', file), build(file))
writeFileSync(join(dist, 'index.css'), build('index.css'))
console.log(`wrote dist/index.css and ${sheets.length} stylesheets to dist/css/`)
