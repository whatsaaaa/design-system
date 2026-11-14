// What the example pages do with the system's modules: register the ghost, turn the keys
// and their switch on, and wire the theme's controls: the key hint and the theme's name.
import { defineGhost } from '../ds/ghost/index.js'
import { enableShortcuts } from '../ds/shortcuts/index.js'
import { toggleTheme } from '../ds/theme/index.js'

defineGhost()
enableShortcuts()
for (const control of document.querySelectorAll('[data-toggle-theme]'))
  control.addEventListener('click', toggleTheme)
