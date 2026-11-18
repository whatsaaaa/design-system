import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import stylelint from 'stylelint'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const fixtures = join(root, 'tests/fixtures/stylelint')

/**
 * Lints a fixture as a project does, with a config that only extends the entry, from a directory
 * that is not this repository, so the tokens are found wherever the linter runs.
 */
const lint = async (fixture: string) => {
  const { results } = await stylelint.lint({
    files: join(fixtures, fixture),
    config: { extends: ['@whatsaaaa/design-system/stylelint'] },
    configBasedir: root,
    cwd: tmpdir(),
  })
  const [result] = results
  return result!.warnings.map(({ line, rule }) => `${line} ${rule}`).sort()
}

describe('the stylelint entry', () => {
  it('rejects a hex value, a named color, a color function and a variable nothing defines', async () => {
    expect(await lint('invalid.css')).toEqual([
      '3 color-no-hex',
      '4 color-named',
      '5 function-disallowed-list',
      '6 csstools/value-no-unknown-custom-properties',
    ])
  })

  it('lets the tokens through, the component tier among them, and a variable of the stylesheet', async () => {
    expect(await lint('valid.css')).toEqual([])
  })

  it('needs none of its optional peers to import, nor does any other entry', () => {
    // every module the exports map names, imported in a Node process that cannot find stylelint
    // or its plugins, as one where they are not installed. An entry made for the browser fails
    // there for want of a document, so what counts is why an entry fails.
    const peers = [
      'stylelint',
      'stylelint-config-standard',
      'stylelint-value-no-unknown-custom-properties',
    ]
    const entries = Object.entries<string | Record<string, string>>(pkg.exports)
      .filter(([, target]) =>
        /\.[jt]s$/.test(typeof target === 'string' ? target : target.default!),
      )
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
      for (const entry of ${JSON.stringify(entries)})
        await import(entry).catch((error) => error.message === 'missing peer' && needing.push(entry))
      const { default: config } = await import('${pkg.name}/stylelint')
      console.log(JSON.stringify({ needing, config }))
    `
    const { needing, config } = JSON.parse(
      execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
    )
    expect(needing).toEqual([])
    expect(config.extends).toEqual(['stylelint-config-standard'])
    for (const peer of peers) {
      expect(pkg.peerDependenciesMeta[peer]).toEqual({ optional: true })
      expect(pkg.dependencies).not.toHaveProperty(peer)
    }
  })

  it('reads the tokens of the same build, wherever it is installed', async () => {
    const { default: config } = await import('@whatsaaaa/design-system/stylelint')
    const [, options] = config.rules!['csstools/value-no-unknown-custom-properties'] as [
      true,
      { importFrom: string[] },
    ]
    expect(options.importFrom).toEqual([join(root, 'dist/tokens.css')])
  })
})
