import type { Sprite } from './sprite.ts'

/**
 * The ghost, pixel by pixel. This file is the source of the mark: the asset kit, the
 * <ws-ghost> element and the style guide all draw from it.
 *
 * It is original artwork: a pale body with a dome, two square eyes, a w-shaped mouth with the
 * tongue out, and a hem that stands on two points. Three habits keep it apart from other
 * ghosts: the tongue is always there and always in the love color, the body is never
 * recolored, and nothing is ever drawn on its face or its tile.
 *
 * `B` body, `T` tongue, `_` a hole in the body (eyes and mouth), `.` empty.
 */
export const GHOST_POSES = {
  /** The mark itself. */
  idle: [
    '................',
    '................',
    '.....BBBBBB.....',
    '....BBBBBBBB....',
    '...BBBBBBBBBB...',
    '...BB__BB__BB...',
    '...BB__BB__BB...',
    '...BBBBBBBBBB...',
    '...BB_B__B_BB...',
    '...BBB_TT_BBB...',
    '...BBBBTTBBBB...',
    '...BBBBBBBBBB...',
    '...BBBB..BBBB...',
    '....BB....BB....',
    '................',
    '................',
  ],
  /** Eyes half shut. */
  blink: [
    '................',
    '................',
    '.....BBBBBB.....',
    '....BBBBBBBB....',
    '...BBBBBBBBBB...',
    '...BBBBBBBBBB...',
    '...BB__BB__BB...',
    '...BBBBBBBBBB...',
    '...BB_B__B_BB...',
    '...BBB_TT_BBB...',
    '...BBBBTTBBBB...',
    '...BBBBBBBBBB...',
    '...BBBB..BBBB...',
    '....BB....BB....',
    '................',
    '................',
  ],
  /** The tongue one pixel to the left. */
  'wag-left': [
    '................',
    '................',
    '.....BBBBBB.....',
    '....BBBBBBBB....',
    '...BBBBBBBBBB...',
    '...BB__BB__BB...',
    '...BB__BB__BB...',
    '...BBBBBBBBBB...',
    '...BB_B__B_BB...',
    '...BBB_TT_BBB...',
    '...BBBTTBBBBB...',
    '...BBBBBBBBBB...',
    '...BBBB..BBBB...',
    '....BB....BB....',
    '................',
    '................',
  ],
  /** The tongue one pixel to the right. */
  'wag-right': [
    '................',
    '................',
    '.....BBBBBB.....',
    '....BBBBBBBB....',
    '...BBBBBBBBBB...',
    '...BB__BB__BB...',
    '...BB__BB__BB...',
    '...BBBBBBBBBB...',
    '...BB_B__B_BB...',
    '...BBB_TT_BBB...',
    '...BBBBBTTBBB...',
    '...BBBBBBBBBB...',
    '...BBBB..BBBB...',
    '....BB....BB....',
    '................',
    '................',
  ],
  /** Mouth wide open, for the shout. */
  shout: [
    '................',
    '................',
    '.....BBBBBB.....',
    '....BBBBBBBB....',
    '...BB__BB__BB...',
    '...BB__BB__BB...',
    '...BBBBBBBBBB...',
    '...BB______BB...',
    '...BB_TTTT_BB...',
    '...BBBTTTTBBB...',
    '...BBBBTTBBBB...',
    '...BBBBBBBBBB...',
    '...BBBB..BBBB...',
    '....BB....BB....',
    '................',
    '................',
  ],
  /** Eyes looking away and the mouth shut, for a page that is not there. */
  lost: [
    '................',
    '................',
    '.....BBBBBB.....',
    '....BBBBBBBB....',
    '...BBBBBBBBBB...',
    '...BB__BB__BB...',
    '...BBB_BBB_BB...',
    '...BBBBBBBBBB...',
    '...BBBBBBBBBB...',
    '...BBB____BBB...',
    '...BBBBBBBBBB...',
    '...BBBBBBBBBB...',
    '...BBBB..BBBB...',
    '....BB....BB....',
    '................',
    '................',
  ],
} as const satisfies Record<string, Sprite>

export type GhostPose = keyof typeof GHOST_POSES

/** The mark: the ghost at rest. */
export const GHOST = GHOST_POSES.idle
