// What the example pages do with the system's modules: register the ghost, turn the key
// hints on, and wire the theme key.
import { defineGhost } from '../ds/ghost/index.js'
import { enableShortcuts } from '../ds/shortcuts/index.js'
import { getTheme, toggleTheme } from '../ds/theme/index.js'

defineGhost()
enableShortcuts()

const name = document.querySelector('[data-theme-name]')
const showTheme = () => {
  name.textContent = getTheme() === 'dark' ? 'rose-pine' : 'rose-pine-dawn'
}
document.querySelector('[data-toggle-theme]').addEventListener('click', toggleTheme)
// the attribute also changes when the page that embeds this one sets it
new MutationObserver(showTheme).observe(document.documentElement, {
  attributeFilter: ['data-theme'],
})
matchMedia('(prefers-color-scheme: light)').addEventListener('change', showTheme)
showTheme()
