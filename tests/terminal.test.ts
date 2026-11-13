import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { tokens } from '../scripts/lib/tokens.ts'

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

describe('the path of the status line', () => {
  const css = read('src/css/terminal.css')

  it('goes as a whole at the padding it has, which its container query writes out', () => {
    // a container query takes no var(), so the query spells out the padding of the path
    expect(css).toMatch(
      /\.ws-status-line__file,\n\.ws-status-line__item \{[^}]*padding-inline: var\(--ws-space-14\);/,
    )
    const query = css.match(
      /@container ws-status-line-path \(width < calc\(2ch \+ 2 \* ([\d.]+)(rem)\)\)/,
    )
    expect(query).not.toBeNull()
    const { value, unit } = tokens('dark')['space.14'].$value
    expect([Number(query![1]), query![2]]).toEqual([value, unit])
  })
})
