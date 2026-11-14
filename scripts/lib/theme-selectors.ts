// Where the stylesheets see a theme chosen by hand. The token build writes these selectors into
// dist/tokens.css, the rules of an element for one theme only into dist/theme-rules.css and
// Tailwind's dark: and light: variants into dist/tailwind/variants.css, so all three read a
// theme the same way and none has a copy of a value.
//
// A theme is chosen on an element, <html> or one inside the page, with data-theme="dark" or
// "light", or with a dark or light class, as Nuxt UI and VueUse's useColorMode set it. No class is
// no choice. So where a library marks light only by leaving dark off, as Tailwind's toggle script,
// VueUse's useDark and VitePress do, a light class is kept in step with dark: on for light, off
// for dark or the system.
// On one element data-theme wins over the class, and both classes together choose nothing. The
// nearest choice around an element holds for it, in whichever way it is made, and any choice on
// <html> holds over the system's theme.

export type Theme = 'dark' | 'light'

const other = (theme: Theme): Theme => (theme === 'dark' ? 'light' : 'dark')

/**
 * An element that chooses the theme. The class is wrapped in :where so that it weighs no more
 * than the attribute: the light block still wins over the :root of the dark one on <html>.
 */
export const chosen = (theme: Theme): string =>
  `[data-theme='${theme}'], .${theme}:where(:not([data-theme], .${other(theme)}))`

/**
 * An element that chooses a theme, either one. Any data-theme counts, as it always has, and so
 * does a class that names one theme.
 */
const anyChosen = '[data-theme], .dark:where(:not(.light)), .light:where(:not(.dark))'

/** <html> when it chooses nothing, so the system decides. */
export const rootUnchosen = `:root:not(${anyChosen})`

/** An element with no choice on it or around it, so the system decides. */
export const unchosen = `:not(${anyChosen}, :is(${anyChosen}) *)`

/**
 * An element where a theme chosen by hand is in effect, one selector for each depth. A selector
 * cannot ask for the nearest choice, so each takes a depth: a part held in the theme, unless a
 * part of the other theme inside it is nearer, and then the same once more inside that. It holds
 * for a choice on <html> and three parts held in a theme, one in the other.
 */
export function inEffect(theme: Theme): string[] {
  // the chain of choices from the outside in: theme, other, theme, other
  const chain = [theme, other(theme), theme, other(theme)].map((one) => `:is(${chosen(one)})`)
  const at = (depth: number) => chain.slice(0, depth).join(' ')
  const within = (depth: number) => `${at(depth)}, ${at(depth)} *`
  return [1, 3].map((depth) => `:where(${within(depth)}):not(${within(depth + 1)})`)
}

/** The media query in which the system's theme is the one given. Dark is the default. */
export const systemIs = (theme: Theme): string =>
  theme === 'light' ? '(prefers-color-scheme: light)' : 'not (prefers-color-scheme: light)'

/** The classes of an element for one theme only. The status line's are older names of them. */
const onlyIn = (theme: Theme) => `:is(.ws-theme-${theme}, .ws-status-line__item--${theme})`

/**
 * The rules that hide an element for one theme only where the other theme is in effect: chosen
 * by hand, or with no choice around the element, by the system.
 */
export function themeRules(): string {
  const hidden = (shown: Theme) =>
    inEffect(other(shown))
      .map((selector) => `${onlyIn(shown)}${selector}`)
      .join(',\n')
  const rule = (selector: string) => `${selector} {\n  display: none !important;\n}`
  const system = (shown: Theme) =>
    `@media ${systemIs(other(shown))} {\n  ${onlyIn(shown)}${unchosen} {\n    display: none !important;\n  }\n}`
  return [rule(hidden('dark')), rule(hidden('light')), system('dark'), system('light')].join('\n\n')
}
