// Copies the built package and the asset kit into the style guide's public folder, so its
// pages can link to the real files: the kit for downloads, dist/ for the standalone examples.
import { cpSync, existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const target = join(root, 'styleguide/public')

if (!existsSync(join(root, 'dist/index.css')))
  throw new Error('dist/ is not built. Run "pnpm build" first.')

for (const [from, to] of [
  ['assets', 'kit'],
  ['dist', 'ds'],
] as const) {
  rmSync(join(target, to), { recursive: true, force: true })
  cpSync(join(root, from), join(target, to), { recursive: true })
}
console.log('copied assets/ and dist/ into styleguide/public/')
