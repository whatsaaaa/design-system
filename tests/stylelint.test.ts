import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { importWithout, pkg, root } from './peers.ts'

const fixtures = join(root, 'tests/fixtures/stylelint')
const stylelint = pathToFileURL(createRequire(join(root, 'package.json')).resolve('stylelint')).href
const elsewhere = mkdtempSync(join(tmpdir(), 'ws-stylelint-'))
afterAll(() => rmSync(elsewhere, { recursive: true, force: true }))

/**
 * Lints a fixture as a project does, with a config that only extends the entry, in a Node process
 * whose working directory is not this repository, so the tokens are found wherever the linter
 * runs.
 */
const lint = (fixture: string): string[] => {
  const script = `
    const { default: stylelint } = await import(${JSON.stringify(stylelint)})
    const { results: [result] } = await stylelint.lint({
      files: ${JSON.stringify(join(fixtures, fixture))},
      config: { extends: ['@whatsaaaa/design-system/stylelint'] },
      configBasedir: ${JSON.stringify(root)},
    })
    console.log(JSON.stringify(result.warnings.map(({ line, rule }) => line + ' ' + rule).sort()))
  `
  return JSON.parse(
    execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: elsewhere,
      encoding: 'utf8',
      stdio: 'pipe',
    }),
  )
}

describe('the stylelint entry', () => {
  it('rejects a hex value, a named color, a color function and a variable nothing defines', () => {
    expect(lint('invalid.css')).toEqual([
      '3 color-no-hex',
      '4 color-named',
      '5 function-disallowed-list',
      '6 csstools/value-no-unknown-custom-properties',
    ])
  }, 30_000)

  it('lets the tokens through, the component tier among them, and a variable of the stylesheet', () => {
    expect(lint('valid.css')).toEqual([])
  }, 30_000)

  // As the lint above, a Node process of its own, here one that imports every entry.
  it('needs none of its optional peers to import, nor does any other entry', async () => {
    const peers = [
      'stylelint',
      'stylelint-config-standard',
      'stylelint-value-no-unknown-custom-properties',
    ]
    const { needing, loaded } = importWithout(peers)
    expect(needing).toEqual([])
    expect(loaded).toContain(`${pkg.name}/stylelint`)
    const { default: config } = await import('@whatsaaaa/design-system/stylelint')
    expect(config.extends).toEqual(['stylelint-config-standard'])
    for (const peer of peers) {
      expect(pkg.peerDependenciesMeta[peer]).toEqual({ optional: true })
      expect(pkg.dependencies).not.toHaveProperty(peer)
    }
  }, 30_000)

  it('reads the tokens of the same build, wherever it is installed', async () => {
    const { default: config } = await import('@whatsaaaa/design-system/stylelint')
    const [, options] = config.rules!['csstools/value-no-unknown-custom-properties'] as [
      true,
      { importFrom: string[] },
    ]
    expect(options.importFrom).toEqual([join(root, 'dist/tokens.css')])
  })
})
