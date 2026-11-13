// Reads the built tokens (dist/tokens.js), so everything generated here follows the token sources.
import { resolver, type Tokens } from '../../dist/tokens.js'
import { colorHex } from '../../src/color.ts'

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

/** An opaque color token as `#rrggbb`. */
export function hex(id: ColorTokenId, theme: Theme = 'dark'): string {
  const value = themes[theme][id].$value
  if (value.alpha !== 1)
    throw new Error(`${id} has an alpha of ${value.alpha}, so it has no plain hex value`)
  return colorHex(value)
}
