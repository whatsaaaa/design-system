// The contrast pairs as the style guide shows them: each pair once, measured in both themes.
import { type ContrastPair, type Measured, measureAll } from '../../../scripts/lib/contrast.ts'
import type { Theme } from '../../../scripts/lib/tokens.ts'

export interface ContrastRow {
  foreground: string
  background: string
  use: string
  min: number
  /** The opaque color a translucent background sits on. */
  over?: string
  dark: { ratio: number; passes: boolean; note?: string }
  light: { ratio: number; passes: boolean; note?: string }
}

export function contrastRows(pairs: ContrastPair[]): ContrastRow[] {
  const measured = measureAll(pairs)
  return measured
    .filter((entry) => entry.theme === 'dark')
    .map((pair) => {
      const of = (theme: Theme) => {
        const entry = measured.find(
          (candidate: Measured) =>
            candidate.theme === theme &&
            candidate.foreground === pair.foreground &&
            candidate.background === pair.background,
        )!
        return { ratio: entry.ratio, passes: entry.passes, note: entry.below?.[theme] }
      }
      return {
        foreground: pair.foreground,
        background: pair.background,
        use: pair.use,
        min: pair.min,
        over: pair.over,
        dark: of('dark'),
        light: of('light'),
      }
    })
}
