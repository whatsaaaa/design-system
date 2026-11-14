import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GHOST, GHOST_POSES } from '../src/identity/ghost.ts'
import { markSvg, rasterMarkSvg } from '../src/identity/marks.ts'
import { type Sprite, checkSprite, spriteBounds, spritePaths } from '../src/identity/sprite.ts'

const blank = (): string[] => Array.from({ length: 16 }, () => '.'.repeat(16))
const draw = (rows: string[], y: number, x: number, cells: string) => {
  rows[y] = rows[y]!.slice(0, x) + cells + rows[y]!.slice(x + cells.length)
  return rows
}
const colors = {
  tile: '#26233a',
  dark: { body: '#e0def4', love: '#eb6f92' },
  light: { body: '#575279', love: '#b4637a' },
}

describe('sprite paths', () => {
  it('draws runs of pixels as one path per color', () => {
    const rows = draw(draw(blank(), 2, 3, 'BBB'), 3, 4, 'TT')
    expect(spritePaths(rows)).toEqual({ body: 'M3 2h3v1h-3z', love: 'M4 3h2v1h-2z' })
    expect(spritePaths(rows, { px: 4, x: 10, y: 20 })).toEqual({
      body: 'M22 28h12v4h-12z',
      love: 'M26 32h8v4h-8z',
    })
  })

  it('leaves holes and empty cells undrawn', () => {
    const rows = draw(blank(), 5, 2, 'B__B')
    expect(spritePaths(rows).body).toBe('M2 5h1v1h-1zM5 5h1v1h-1z')
  })

  it('finds the box of the drawn pixels', () => {
    expect(spriteBounds(GHOST)).toEqual({ x: 3, y: 2, width: 10, height: 12 })
  })
})

describe('the ghost', () => {
  it.each(Object.entries(GHOST_POSES))('pose %s follows the rules', (_name, rows) => {
    expect(checkSprite(rows, 'ghost')).toEqual([])
  })

  it('keeps one outline in every pose, so poses can swap in place', () => {
    const outline = (rows: Sprite) => rows.map((row) => row.replace(/[T_]/g, 'B'))
    for (const [name, rows] of Object.entries(GHOST_POSES))
      expect(outline(rows), name).toEqual(outline(GHOST))
  })

  it('has its tongue out in every pose but the lost one', () => {
    for (const [name, rows] of Object.entries(GHOST_POSES))
      expect(
        rows.some((row) => row.includes('T')),
        name,
      ).toBe(name !== 'lost')
  })
})

describe('project sprites', () => {
  const dir = new URL('../identity/projects/', import.meta.url)
  const projects = readdirSync(dir).map((file) =>
    JSON.parse(readFileSync(new URL(file, dir), 'utf8')),
  )

  it.each(projects)('$name follows the rules of the family', ({ sprite }) => {
    expect(checkSprite(sprite, 'project')).toEqual([])
  })

  // The usage guide tells a page to pull a free mark out by an eighth of its size to put its
  // pixels on an edge. When a sprite leaves another margin, the guide has to say so.
  it.each(projects)(
    '$name leaves two empty columns on each side, as the usage guide says',
    ({ sprite }) => {
      const { x, width } = spriteBounds(sprite)
      expect([x, 16 - x - width]).toEqual([2, 2])
    },
  )

  it('says what is wrong with a sprite, in words', () => {
    expect(checkSprite(blank().slice(1), 'project')).toEqual(['has 15 rows, needs 16'])
    expect(checkSprite(draw(blank(), 4, 2, 'BXB'), 'project')).toEqual([
      'row 5 has unknown cells "X"',
    ])
    expect(checkSprite(draw(blank(), 0, 2, 'BB'), 'project')).toContain(
      'draws on the outermost pixels, keep them empty',
    )
    expect(checkSprite(draw(blank(), 4, 2, 'BBB'), 'project')).toEqual([
      'has 0 love elements (T), needs exactly one',
    ])
    expect(
      checkSprite(draw(draw(draw(blank(), 4, 2, 'BBB'), 6, 2, 'T'), 6, 6, 'T'), 'project'),
    ).toEqual(['has 2 love elements (T), needs exactly one'])
    expect(checkSprite(draw(draw(blank(), 6, 2, 'BBB'), 4, 2, 'TT'), 'project')).toEqual([
      'needs its love element (T) to hang below the body (B)',
    ])
    expect(checkSprite(draw(draw(blank(), 4, 2, 'B_B'), 6, 2, 'TT'), 'project')).toContain(
      'uses holes (_), which only the ghost has. Leave the pixels empty (.)',
    )
  })
})

describe('marks', () => {
  it('draws the tile only in the tile cut', () => {
    const cut = (name: Parameters<typeof markSvg>[2]['cut']) =>
      markSvg(GHOST, 'whatsaaaa mark', { cut: name, colors, monoLove: 'hole' })
    expect(cut('tile')).toContain('<rect width="64" height="64" rx="14" fill="#26233a"/>')
    expect(cut('on-dark')).not.toContain('<rect')
    expect(cut('on-light')).toContain('fill="#575279"')
    expect(cut('on-light')).toContain('fill="#b4637a"')
  })

  it('makes the tongue a hole in one color, and a project love element ink', () => {
    const mono = (monoLove: 'hole' | 'ink') =>
      markSvg(GHOST, 'mark', { cut: 'mono', colors, monoLove })
    const tongue = spritePaths(GHOST, { px: 4 }).love
    expect(mono('hole')).not.toContain(tongue)
    expect(mono('ink')).toContain(tongue)
    expect(mono('hole')).toContain('fill="currentColor"')
    expect(mono('hole')).not.toContain('#')
  })

  it('names the image for screen readers and escapes the name', () => {
    expect(markSvg(GHOST, 'a "b" <c>', { cut: 'tile', colors, monoLove: 'hole' })).toContain(
      'aria-label="a &quot;b&quot; &lt;c&gt;"',
    )
  })

  it.each([
    [16, 1, 0],
    [32, 2, 0],
    [48, 3, 0],
    [180, 11, 2],
    [192, 12, 0],
    [512, 32, 0],
  ])('draws a %i px mark with %i px per sprite pixel', (size, px, offset) => {
    const svg = rasterMarkSvg(GHOST, size, colors)
    // the first body run of the ghost is 6 pixels wide and starts at column 5, row 2
    expect(svg).toContain(`M${offset + 5 * px} ${offset + 2 * px}h${6 * px}v${px}`)
  })

  it('refuses a size it cannot draw on whole pixels', () => {
    expect(() => rasterMarkSvg(GHOST, 8, colors)).toThrow('at least 16 px')
    expect(() => rasterMarkSvg(GHOST, 33, colors)).toThrow('cannot be centered on whole pixels')
  })

  it('fills the whole image for the touch icon', () => {
    expect(rasterMarkSvg(GHOST, 180, colors, { square: true })).toContain('rx="0"')
    expect(rasterMarkSvg(GHOST, 180, colors)).toContain('rx="39"')
  })
})
