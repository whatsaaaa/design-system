import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Window } from 'happy-dom'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const site = join(root, 'tests/fixtures/docs-site')
const out = mkdtempSync(join(tmpdir(), 'ws-docs-site-'))

/** A page of the built site, as the server sends it. */
function page(file: string) {
  const { document } = new Window()
  document.write(readFileSync(join(out, file), 'utf8'))
  return document
}

describe('a docs site on the theme', () => {
  beforeAll(() => {
    execFileSync(
      process.execPath,
      ['node_modules/vitepress/bin/vitepress.js', 'build', site, '--outDir', out],
      { cwd: root, stdio: 'pipe' },
    )
  }, 120_000)
  afterAll(() => {
    rmSync(out, { recursive: true, force: true })
    rmSync(join(site, '.vitepress/cache'), { recursive: true, force: true })
  })

  it('adds to the slots the theme fills itself, next to what the theme puts there', () => {
    const document = page('guide/index.html')
    expect(document.querySelector('#site-nav')?.textContent).toBe('sto za dvoje')
    expect(document.querySelector('.WsNavGhost')).not.toBeNull()
    expect(document.querySelector('#site-doc-before')?.textContent).toBe('Otvoreno od osam.')
    expect(document.querySelector('.WsCrumb')).not.toBeNull()
    expect(document.querySelector('#site-bottom')?.textContent).toBe('kafana, Niš')
    expect(document.querySelector('.WsStatusLine')).not.toBeNull()
  })

  it('fills a slot the theme leaves alone', () => {
    const document = page('guide/index.html')
    expect(document.querySelector('#site-doc-after')?.textContent).toBe('Vidimo se u Čačku.')
  })

  it('shows the path on the index page of a section: tab, sidebar group, page', () => {
    const parts = [...page('guide/index.html').querySelectorAll('.WsCrumb > span')]
    expect(parts.map((part) => part.textContent)).toEqual(['vodič', 'Uvod', 'Rezervacije'])
  })
})
