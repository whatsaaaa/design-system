// What the example pages do with the system's modules: register the ghost, turn the keys
// and their switch on, wire the theme's controls, the key hint and the theme's name, say
// INSERT while a field has the focus, and press the segment of a segmented control.
import { defineGhost } from '../ds/ghost/index.js'
import { enableShortcuts, isTyping } from '../ds/shortcuts/index.js'
import { toggleTheme } from '../ds/theme/index.js'

defineGhost()
enableShortcuts()
for (const control of document.querySelectorAll('[data-toggle-theme]'))
  control.addEventListener('click', toggleTheme)

const mode = document.querySelector('.ws-status-line__mode')
const showMode = () => {
  if (mode) mode.textContent = isTyping(document.activeElement) ? 'INSERT' : 'NORMAL'
}
document.addEventListener('focusin', showMode)
document.addEventListener('focusout', () => setTimeout(showMode))

// one segment is pressed at a time: pressing another moves it there, pressing it again does nothing
for (const group of document.querySelectorAll('[data-segmented]'))
  group.addEventListener('click', (event) => {
    const pressed = event.target.closest('button')
    if (!pressed) return
    for (const segment of group.querySelectorAll('button'))
      segment.setAttribute('aria-pressed', String(segment === pressed))
  })

// the example sends nothing
for (const form of document.querySelectorAll('[data-example-form]'))
  form.addEventListener('submit', (event) => event.preventDefault())
