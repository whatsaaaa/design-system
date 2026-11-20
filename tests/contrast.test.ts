import { describe, expect, it } from 'vitest'
import { allPairs, measure, measureAll, readPairs } from '../scripts/lib/contrast.ts'

describe('contrast of the role pairs', () => {
  const measured = measureAll()

  it('checks a meaningful number of pairs in both themes', () => {
    expect(readPairs().length).toBeGreaterThan(40)
    // the pairs of tokens/contrast.json and the ones the component tier's names imply
    expect(measured).toHaveLength(allPairs().length * 2)
    expect(allPairs().length).toBeGreaterThan(readPairs().length)
  })

  it.each(measured.filter((pair) => !pair.below?.[pair.theme]))(
    '$theme: $foreground on $background reaches $min',
    ({ ratio, min }) => {
      expect(ratio).toBeGreaterThanOrEqual(min)
    },
  )

  // A pair that is accepted below its bar has to be below it. Once it passes, the exception goes.
  it.each(measured.filter((pair) => pair.below?.[pair.theme]))(
    '$theme: $foreground on $background is still below $min, as its note says',
    ({ ratio, min, below, theme }) => {
      expect(ratio).toBeLessThan(min)
      expect(below?.[theme]?.length).toBeGreaterThan(40)
    },
  )

  it('measures the values the direction was settled on', () => {
    const ratio = (theme: string, foreground: string, background: string) =>
      measured.find(
        (pair) =>
          pair.theme === theme && pair.foreground === foreground && pair.background === background,
      )?.ratio
    expect(ratio('dark', 'color.text', 'color.bg')).toBe(13.38)
    expect(ratio('light', 'color.text', 'color.bg')).toBe(6.65)
    expect(ratio('dark', 'color.text-secondary', 'color.bg')).toBe(5.47)
    expect(ratio('dark', 'color.interactive', 'color.bg')).toBe(10.36)
    expect(ratio('light', 'color.interactive', 'color.bg')).toBe(5.59)
    expect(ratio('dark', 'color.tag-text', 'color.tag-bg')).toBe(8.05)
    expect(ratio('light', 'color.tag-text', 'color.tag-bg')).toBe(4.87)
    expect(ratio('dark', 'mark.body', 'mark.tile')).toBe(11.5)
    expect(ratio('light', 'color.warning', 'color.bg')).toBe(2.05)
    // the required mark is red in both themes, and darker in light so it reads as small text
    expect(ratio('dark', 'color.brand-text', 'color.bg')).toBe(6.07)
    expect(ratio('light', 'color.brand-text', 'color.bg')).toBe(4.73)
  })

  // A translucent fill takes the color of what lies under it, so its pair has no ratio until it
  // names that ground.
  it('fails a pair on a translucent background that does not name what it lies over', () => {
    const pair = {
      foreground: 'code.text',
      background: 'code.line-added',
      min: 4.5,
      use: 'Code on an added line',
    } as const
    expect(() => measure(pair, 'dark')).toThrow(
      'code.line-added is translucent in dark, so the pair has to name `over`',
    )
    expect(measure({ ...pair, over: 'code.bg' }, 'dark').passes).toBe(true)
  })
})
