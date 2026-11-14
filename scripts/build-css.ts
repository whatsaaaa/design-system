// Bundles the stylesheets in src/css/ into dist/: each one on its own in dist/css/, and all
// of them with the fonts and tokens in dist/index.css. Needs dist/tokens.css,
// dist/theme-rules.css and dist/fonts.css. The comments between rules come along, as they
// carry the markup of each piece.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { transform } from 'lightningcss'
import { holdComments, restoreComments } from './lib/css-comments.ts'

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

const IMPORT = /^@import\s+(['"])(.+?)\1;[ \t]*\n?/gm

/** A part of a stylesheet, from one of the times its file is imported. */
interface Piece {
  file: string
  time: number
  text: string
}

/**
 * A stylesheet and what it imports, in order: what comes before its first import, then each
 * import, then the rest. A comment at the top of a file so stays above what it imports.
 */
function pieces(file: string, times: Map<string, number>): Piece[] {
  const time = (times.get(file) ?? 0) + 1
  times.set(file, time)
  const css = readFileSync(file, 'utf8')
  const imports = [...css.matchAll(IMPORT)]
  if (imports.length === 0) return [{ file, time, text: css }]
  const last = imports.at(-1)!
  return [
    { file, time, text: css.slice(0, imports[0]!.index) },
    ...imports.flatMap(([, , path]) => pieces(resolve(dirname(file), path!), times)),
    { file, time, text: css.slice(last.index + last[0].length) },
  ]
}

/**
 * A stylesheet with its imports in their place. A file imported twice keeps its last place,
 * where the browser would apply it, as the bundler of lightningcss does. That bundler would
 * drop a held comment above an import, which is why the imports are put in here. The
 * comments of the sources are held as placeholders, the generated files' are left out.
 */
function inline(file: string, held: string[]): string {
  const times = new Map<string, number>()
  return pieces(file, times)
    .filter((piece) => piece.time === times.get(piece.file))
    .map((piece) =>
      piece.file.startsWith(`${source}/`) ? holdComments(piece.text, held) : piece.text,
    )
    .join('')
}

function build(file: string): string {
  const held: string[] = []
  const { code, warnings } = transform({
    filename: join(source, file),
    code: Buffer.from(inline(join(source, file), held)),
    drafts: { customMedia: true },
    targets,
    minify: false,
  })
  for (const warning of warnings) console.warn(`${file}: ${warning.message}`)
  return restoreComments(code.toString(), held)
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
