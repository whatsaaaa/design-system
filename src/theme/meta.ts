/**
 * The theme-color tags of the served HTML, for a visitor without JavaScript and for a link
 * preview, which read the page as the server sends it: the background of the dark theme,
 * unless the system asks for light, as the stylesheet chooses with no choice by hand. The
 * head script of the theme module takes them over from the first paint on and gives them the
 * background of the theme shown, a choice by hand included.
 *
 * The dark tag comes first, so a reader that ignores media, such as a link preview, takes the
 * system's default theme. It reads the tokens, so it is for a build or a server, and not for
 * the page's own script: the theme module itself carries no color.
 */
import { resolver } from '../../dist/tokens.js'
import { colorHex } from '../color.ts'

/** The attributes of one theme-color tag. */
export interface ThemeColorMeta {
  name: 'theme-color'
  content: string
  media: string
}

const background = (theme: 'dark' | 'light') =>
  colorHex(resolver.apply({ theme })['color.bg'].$value)

/** The tags as attributes, for a framework that writes the <head> from data. */
export const themeColorMeta: readonly ThemeColorMeta[] = [
  {
    name: 'theme-color',
    content: background('dark'),
    media: 'not all and (prefers-color-scheme: light)',
  },
  { name: 'theme-color', content: background('light'), media: '(prefers-color-scheme: light)' },
]
