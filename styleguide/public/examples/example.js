// What the example pages do with the system's modules: register the ghost, turn the keys
// and their switch on, and wire the theme key.
import { defineGhost } from '../ds/ghost/index.js'
import { enableShortcuts } from '../ds/shortcuts/index.js'
import { toggleTheme } from '../ds/theme/index.js'

defineGhost()
enableShortcuts()
document.querySelector('[data-toggle-theme]').addEventListener('click', toggleTheme)
