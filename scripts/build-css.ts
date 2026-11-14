// Bundles the stylesheets in src/css/ into dist/: each one on its own in dist/css/, and all
// of them with the fonts and tokens in dist/index.css. Writes dist/tailwind.css, which imports
// the same files as index.css, from dist/. Needs dist/tokens.css, dist/theme-rules.css,
// dist/tailwind/ and dist/fonts.css.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { bundle } from 'lightningcss'
import { tailwindEntry } from './lib/tailwind.ts'

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

// the imports of index.css, as the files in dist/ that tailwind.css imports in their place
const entry = [...readFileSync(join(source, 'index.css'), 'utf8').matchAll(/@import '([^']+)'/g)]
  .map(([, path]) => resolve(source, path!))
  .map((path) => (path.startsWith(source) ? join(dist, 'css', relative(source, path)) : path))
  .map((path) => {
    if (!existsSync(path)) throw new Error(`tailwind.css would import ${path}, which is not built`)
    return `./${relative(dist, path)}`
  })
writeFileSync(join(dist, 'tailwind.css'), tailwindEntry(entry))
console.log(`wrote dist/index.css, dist/tailwind.css and ${sheets.length} stylesheets to dist/css/`)
