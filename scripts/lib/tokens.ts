// Reads the built tokens (dist/tokens.js), so everything generated here follows the token sources.
import { resolver, type Tokens } from '../../dist/tokens.js'

export type Theme = 'dark' | 'light'
export type TokenId = keyof Tokens

type ColorTokenId = {
  [Id in TokenId]: Tokens[Id]['$type'] extends 'color' ? Id : never
}[TokenId]

const themes: Record<Theme, Tokens> = {
  dark: resolver.apply({ theme: 'dark' }),
  light: resolver.apply({ theme: 'light' }),
}

export const tokens = (theme: Theme): Tokens => themes[theme]

const channel = (component: number) =>
  Math.round(component * 255)
    .toString(16)
    .padStart(2, '0')

/** An opaque color token as `#rrggbb`. */
export function hex(id: ColorTokenId, theme: Theme = 'dark'): string {
  const { components, alpha } = themes[theme][id].$value
  if (alpha !== 1) throw new Error(`${id} has an alpha of ${alpha}, so it has no plain hex value`)
  return '#' + components.map((component) => channel(component ?? 0)).join('')
}
