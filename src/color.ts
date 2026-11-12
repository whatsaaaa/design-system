const channel = (component: number | null) =>
  Math.round((component ?? 0) * 255)
    .toString(16)
    .padStart(2, '0')

/** The value of a color token as `#rrggbb`, or as `#rrggbbaa` when it is translucent. */
export function colorHex({
  components,
  alpha,
}: {
  components: (number | null)[]
  alpha: number
}): string {
  return `#${components.map(channel).join('')}${alpha === 1 ? '' : channel(alpha)}`
}
