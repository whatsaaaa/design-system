import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = fileURLToPath(new URL('..', import.meta.url))
export const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

/**
 * Every module the exports map names, imported in a Node process that cannot find the peers, as
 * one where they are not installed: those that fail for want of one, and those that load. An
 * entry made for the browser fails there for want of a document, so what counts is why an entry
 * fails.
 */
export const importWithout = (peers: string[]): { needing: string[]; loaded: string[] } => {
  const entries = Object.entries<string | Record<string, string>>(pkg.exports)
    .filter(([, target]) => /\.[jt]s$/.test(typeof target === 'string' ? target : target.default!))
    .map(([subpath]) => `${pkg.name}${subpath.slice(1)}`)
  const script = `
    import { registerHooks } from 'node:module'
    const peers = ${JSON.stringify(peers)}
    registerHooks({
      resolve(specifier, context, next) {
        if (peers.includes(specifier)) throw new Error('missing peer')
        return next(specifier, context)
      },
    })
    const needing = []
    const loaded = []
    for (const entry of ${JSON.stringify(entries)})
      await import(entry).then(
        () => loaded.push(entry),
        (error) => error.message === 'missing peer' && needing.push(entry),
      )
    console.log(JSON.stringify({ needing, loaded }))
  `
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    }),
  )
}
