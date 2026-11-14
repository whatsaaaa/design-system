/**
 * The theme switch. The stylesheet does the work: dark is the default, light applies when
 * the system asks for it, and data-theme="dark" or "light" on <html> overrides both, as does
 * a dark or light class where there is no data-theme. This module sets the attribute by hand
 * and remembers the choice. The head script keeps the browser's own bars, such as a phone's
 * address bar, at the background of the theme shown.
 */
import { themeColorScript } from './color.ts'

export type Theme = 'dark' | 'light'
export type ThemeChoice = Theme | 'system'

/** Where the choice is kept in localStorage. Nothing is stored while it follows the system. */
export const THEME_STORAGE_KEY = 'ws-theme'

const isTheme = (value: unknown): value is Theme => value === 'dark' || value === 'light'

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(value) ? value : null
  } catch {
    // storage can be blocked. The theme then follows the system.
    return null
  }
}

/** The theme a dark or light class on <html> chooses, as a color mode library sets it. */
function classTheme(): Theme | null {
  const { classList } = document.documentElement
  const dark = classList.contains('dark')
  if (dark === classList.contains('light')) return null
  return dark ? 'dark' : 'light'
}

/** The theme chosen by hand, with data-theme or a dark or light class, or `system`. */
export function getThemeChoice(): ThemeChoice {
  const attribute = document.documentElement.dataset.theme
  if (isTheme(attribute)) return attribute
  // on one element data-theme wins over the class, as in the stylesheet
  return (attribute === undefined ? classTheme() : null) ?? stored() ?? 'system'
}

/** The theme the page shows right now. */
export function getTheme(): Theme {
  const choice = getThemeChoice()
  if (choice !== 'system') return choice
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Chooses a theme by hand, or `system` to follow the system setting again. */
export function setTheme(choice: ThemeChoice): void {
  const root = document.documentElement
  if (choice === 'system') delete root.dataset.theme
  else root.dataset.theme = choice
  try {
    if (choice === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // the choice still holds for this page
  }
}

/** Switches to the other theme and returns it. */
export function toggleTheme(): Theme {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

/**
 * A script for the <head>, before any stylesheet, that applies a remembered choice before
 * the first paint. Without it a page chosen dark by hand flashes light on a light system.
 * It also keeps <meta name="theme-color"> at the background of the theme shown, from the
 * first paint on, when the theme is chosen by hand and when the system's theme changes.
 *
 *   <script>{themeInitScript}</script>
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}})();${themeColorScript}`
