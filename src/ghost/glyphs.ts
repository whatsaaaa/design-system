/**
 * The six letters of the shout, as pixel outlines, so the speech bubble loads no font.
 *
 * They are the glyphs of Departure Mono 1.500 at its native 11 px.
 * Copyright 2022-2024 Helena Zhang (helenazhang.com), SIL Open Font License 1.1.
 * The license is in licenses/departure-mono.OFL.txt.
 *
 * Each glyph is path data in font pixels, with the baseline at y = 0.
 */
export const BUBBLE_GLYPHS: Record<string, string> = {
  w: 'M1 -6L1 -1L2 -1L2 -6M5 -6L5 -1L4 -1L4 0L6 0L6 -6M4 -1L4 -6L3 -6L3 -1M2 -1L2 0L3 0L3 -1',
  h: 'M1 -8L1 0L2 0L2 -4L3 -4L3 -5L2 -5L2 -8M5 -5L5 0L6 0L6 -5M3 -6L3 -5L5 -5L5 -6',
  a: 'M1 -3L1 -1L2 -1L2 -3M2 -1L2 0L4 0L4 -1M4 -2L4 -1L5 -1L5 0L6 0L6 -5L5 -5L5 -4L2 -4L2 -3L5 -3L5 -2M2 -6L2 -5L5 -5L5 -6',
  t: 'M2 -8L2 -6L1 -6L1 -5L2 -5L2 -1L3 -1L3 -5L6 -5L6 -6L3 -6L3 -8M3 -1L3 0L5 0L5 -1M5 -2L5 -1L6 -1L6 -2',
  s: 'M5 -1L2 -1L2 0L5 0M2 -1L2 -2L1 -2L1 -1M5 -6L2 -6L2 -5L5 -5M1 -5L1 -4L2 -4L2 -5M2 -4L2 -3L5 -3L5 -4M5 -3L5 -1L6 -1L6 -3M5 -5L5 -4L6 -4L6 -5',
  '!': 'M3 -8L3 -2L4 -2L4 -8M3 -1L3 0L4 0L4 -1',
}

/** How far one letter moves the next, in font pixels. */
export const BUBBLE_ADVANCE = 7
