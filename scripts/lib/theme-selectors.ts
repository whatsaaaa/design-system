// Where the stylesheets see a theme chosen by hand. The token build writes these selectors into
// dist/tokens.css and the rules of an element for one theme only into dist/theme-rules.css, so
// both read a theme the same way and neither has a copy of a value.
//
// A theme is chosen on an element, <html> or one inside the page, with data-theme="dark" or
// "light", or with a dark or light class, as Nuxt UI and VueUse's useColorMode set it. No class is
// no choice, so a library that marks light only by leaving dark off, as Tailwind's toggle script,
// VueUse's useDark and VitePress do, has to add a light class or data-theme for light.
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

/** The classes of an element for one theme only. The status line's are older names of them. */
const onlyIn = (theme: Theme) => `:is(.ws-theme-${theme}, .ws-status-line__item--${theme})`

/**
 * The rules that hide an element for one theme only where the other theme is in effect. A
 * selector cannot ask for the nearest choice, so each rule takes a depth: a part held in a theme,
 * unless a part of the other theme inside it is nearer, and then the same once more inside that.
 * It holds for a choice on <html> and three parts held in a theme, one in the other. With no
 * choice around the element the system decides, and dark is the default.
 */
export function themeRules(): string {
  const hidden = (shown: Theme) => {
    const hiding = other(shown)
    // the chain of choices from the outside in: hiding, shown, hiding, shown
    const chain = [hiding, shown, hiding, shown].map((theme) => `:is(${chosen(theme)})`)
    const at = (depth: number) => chain.slice(0, depth).join(' ')
    const within = (depth: number) => `${at(depth)}, ${at(depth)} *`
    return [1, 3]
      .map((depth) => `${onlyIn(shown)}:where(${within(depth)}):not(${within(depth + 1)})`)
      .join(',\n')
  }
  const rule = (selector: string) => `${selector} {\n  display: none !important;\n}`
  const system = (query: string, shown: Theme) =>
    `@media ${query} {\n  ${onlyIn(shown)}:not(${anyChosen}, :is(${anyChosen}) *) {\n    display: none !important;\n  }\n}`
  return [
    rule(hidden('dark')),
    rule(hidden('light')),
    system('(prefers-color-scheme: light)', 'dark'),
    system('not (prefers-color-scheme: light)', 'light'),
  ].join('\n\n')
}
