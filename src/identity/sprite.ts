/**
 * A 16 x 16 sprite, one string per row.
 * `B` is the body, `T` the love element (the ghost's tongue), `_` a hole in the body, `.` empty.
 */
export type Sprite = readonly string[]

/** Sprites are drawn on a 16 x 16 grid, so at 16 px one sprite pixel is one screen pixel. */
export const GRID = 16

export interface SpritePaths {
  /** Path data of the body, or an empty string. */
  body: string
  /** Path data of the love element, or an empty string. */
  love: string
}

export interface SpritePlacement {
  /** Size of one sprite pixel. */
  px?: number
  /** Where the grid's top left corner goes. */
  x?: number
  y?: number
}

/**
 * Path data for a sprite: one path per color, as runs of whole pixels.
 * One path per color means neighbouring pixels never show a seam between them when scaled.
 */
export function spritePaths(
  rows: Sprite,
  { px = 1, x = 0, y = 0 }: SpritePlacement = {},
): SpritePaths {
  const paths = { B: '', T: '' }
  rows.forEach((row, rowIndex) => {
    let column = 0
    while (column < row.length) {
      const cell = row[column]
      let run = 1
      while (row[column + run] === cell) run++
      if (cell === 'B' || cell === 'T')
        paths[cell] += `M${x + column * px} ${y + rowIndex * px}h${run * px}v${px}h${-run * px}z`
      column += run
    }
  })
  return { body: paths.B, love: paths.T }
}

export interface SpriteBounds {
  x: number
  y: number
  width: number
  height: number
}

/** The box the drawn pixels occupy, so a sprite can sit in a line of text without its margin. */
export function spriteBounds(rows: Sprite): SpriteBounds {
  let [left, top, right, bottom] = [GRID, GRID, 0, 0]
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue
      left = Math.min(left, x)
      right = Math.max(right, x + 1)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y + 1)
    }
  })
  return { x: left, y: top, width: right - left, height: bottom - top }
}

/** Counts the groups of `cell` pixels that touch each other by an edge. */
function countRegions(rows: Sprite, cell: string): number {
  const seen = new Set<string>()
  let regions = 0
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y]!.length; x++) {
      if (rows[y]![x] !== cell || seen.has(`${x},${y}`)) continue
      regions++
      const queue: [number, number][] = [[x, y]]
      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!
        if (rows[cy]?.[cx] !== cell || seen.has(`${cx},${cy}`)) continue
        seen.add(`${cx},${cy}`)
        queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
      }
    }
  }
  return regions
}

const lastRowWith = (rows: Sprite, cell: string) =>
  rows.reduce((last, row, y) => (row.includes(cell) ? y : last), -1)

/**
 * Checks a sprite against the rules every mark of the family follows.
 * Returns the problems found, in words. An empty list means the sprite is fine.
 *
 * - every sprite: 16 rows of 16 cells, only the four known cells, one empty pixel around the
 *   edge so nothing touches the rounded corners of the tile
 * - a project sprite: no holes, and exactly one love element, which hangs below the body
 * - the ghost: exactly one tongue, or none in the one pose that has its mouth shut
 */
export function checkSprite(rows: Sprite, kind: 'ghost' | 'project'): string[] {
  const problems: string[] = []
  if (rows.length !== GRID) problems.push(`has ${rows.length} rows, needs ${GRID}`)
  rows.forEach((row, y) => {
    if (row.length !== GRID) problems.push(`row ${y + 1} has ${row.length} cells, needs ${GRID}`)
    const unknown = row.replace(/[.BT_]/g, '')
    if (unknown) problems.push(`row ${y + 1} has unknown cells "${unknown}"`)
  })
  if (problems.length > 0) return problems

  const edge = [rows[0]!, rows[GRID - 1]!, ...rows.map((row) => row[0]! + row[GRID - 1]!)].join('')
  if (edge.replace(/\./g, '') !== '')
    problems.push('draws on the outermost pixels, keep them empty')
  if (lastRowWith(rows, 'B') === -1) problems.push('has no body pixels (B)')

  const loveElements = countRegions(rows, 'T')
  if (kind === 'project') {
    if (rows.some((row) => row.includes('_')))
      problems.push('uses holes (_), which only the ghost has. Leave the pixels empty (.)')
    if (loveElements !== 1)
      problems.push(`has ${loveElements} love elements (T), needs exactly one`)
    else if (lastRowWith(rows, 'T') <= lastRowWith(rows, 'B'))
      problems.push('needs its love element (T) to hang below the body (B)')
  } else if (loveElements > 1) {
    problems.push(`has ${loveElements} tongues (T), needs one at most`)
  }
  return problems
}
