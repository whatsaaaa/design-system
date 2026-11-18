import { tmpdir } from 'node:os'
import { join } from 'node:path'
import stylelint from 'stylelint'
import { describe, expect, it } from 'vitest'
import { importWithout, pkg, root } from './peers.ts'

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
