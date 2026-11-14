// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hex } from '../scripts/lib/tokens.ts'
import {
  THEME_STORAGE_KEY,
  getTheme,
  getThemeChoice,
  setTheme,
  themeInitScript,
  toggleTheme,
} from '../src/theme/index.ts'

const root = document.documentElement
/** What a change of the system's theme calls: the listeners the scripts gave matchMedia. */
let systemChanges: (() => void)[] = []

/** The system's theme, for the module and for the media queries of the stylesheet. */
function systemPrefers(theme: 'dark' | 'light') {
  ;(window as unknown as HappyDOMWindow).happyDOM.settings.device.prefersColorScheme = theme
  // happy-dom keeps the computed styles of <html> until it changes, where a browser computes
  // them again for the new theme
  root.setAttribute('data-system', theme)
  root.removeAttribute('data-system')
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: query.includes(theme),
        addEventListener: (_type: string, listener: () => void) => systemChanges.push(listener),
      }) as unknown as MediaQueryList,
  )
}
interface HappyDOMWindow {
  happyDOM: { settings: { device: { prefersColorScheme: string } } }
}

beforeEach(() => {
  localStorage.clear()
  delete root.dataset.theme
  root.className = ''
  systemChanges = []
  systemPrefers('dark')
})
afterEach(() => {
  vi.restoreAllMocks()
  document.head.replaceChildren()
})

describe('the theme switch', () => {
  it('follows the system until a theme is chosen by hand', () => {
    expect(getThemeChoice()).toBe('system')
    expect(getTheme()).toBe('dark')
    systemPrefers('light')
    expect(getTheme()).toBe('light')
    expect(root.dataset.theme).toBeUndefined()
  })

  it('sets the attribute the tokens read and remembers the choice', () => {
    systemPrefers('light')
    setTheme('dark')
    expect(root.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(getTheme()).toBe('dark')
    expect(getThemeChoice()).toBe('dark')
  })

  it('follows the system again when asked to', () => {
    setTheme('light')
    setTheme('system')
    expect(root.dataset.theme).toBeUndefined()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(getTheme()).toBe('dark')
  })

  it('toggles from whatever shows now, the system theme included', () => {
    systemPrefers('light')
    expect(toggleTheme()).toBe('dark')
    expect(toggleTheme()).toBe('light')
    expect(root.dataset.theme).toBe('light')
  })

  it('reads a dark or light class on <html> as a choice, as a color mode library sets it', () => {
    root.classList.add('dark')
    systemPrefers('light')
    expect(getThemeChoice()).toBe('dark')
    expect(getTheme()).toBe('dark')
    root.classList.replace('dark', 'light')
    systemPrefers('dark')
    expect(getThemeChoice()).toBe('light')
    expect(getTheme()).toBe('light')
    // both classes choose nothing
    root.classList.add('dark')
    expect(getThemeChoice()).toBe('system')
  })

  it('reads data-theme over the class when both are there', () => {
    root.classList.add('dark')
    root.dataset.theme = 'light'
    expect(getTheme()).toBe('light')
    // so a toggle switches what shows, and the class is left to whoever set it
    expect(toggleTheme()).toBe('dark')
    expect(toggleTheme()).toBe('light')
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('toggles from a theme the class chose', () => {
    root.classList.add('light')
    expect(toggleTheme()).toBe('dark')
    expect(root.dataset.theme).toBe('dark')
  })

  it('still switches when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => setTheme('light')).not.toThrow()
    expect(root.dataset.theme).toBe('light')
  })
})

/** Runs the head script, as the page does before its stylesheet. */
const run = () => new Function(themeInitScript)()
const colors = () =>
  [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map(
    (tag) => tag.content,
  )
/** The token stylesheet, as a page loads it. */
const loadStyles = () => {
  const style = document.createElement('style')
  // vitest runs from the repository root
  style.textContent = readFileSync(join(process.cwd(), 'dist/tokens.css'), 'utf8')
  document.head.append(style)
}
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

describe("the color of the browser's own bars", () => {
  it('is the background of the theme chosen by hand, from the tokens', async () => {
    loadStyles()
    run()
    setTheme('light')
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'light')]))
    toggleTheme()
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'dark')]))
  })

  it('is the background of the system theme again when the page follows the system', async () => {
    loadStyles()
    systemPrefers('light')
    run()
    setTheme('dark')
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'dark')]))
    setTheme('system')
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'light')]))
  })

  it('follows a dark or light class on <html>, whoever sets it, against the system too', async () => {
    loadStyles()
    systemPrefers('light')
    run()
    await nextFrame()
    expect(colors()).toEqual([hex('color.bg', 'light')])
    // as Nuxt UI's or VueUse's color mode switches it
    root.classList.add('dark')
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'dark')]))
    root.classList.remove('dark')
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'light')]))
    systemPrefers('dark')
    for (const change of systemChanges) change()
    expect(colors()).toEqual([hex('color.bg', 'dark')])
    root.classList.add('light')
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'light')]))
  })

  it('follows data-theme over the class when both are there', async () => {
    loadStyles()
    root.classList.add('light')
    run()
    await nextFrame()
    expect(colors()).toEqual([hex('color.bg', 'light')])
    setTheme('dark')
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'dark')]))
    setTheme('system')
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'light')]))
  })

  it('goes on every theme-color tag the page has, and adds none of its own', async () => {
    loadStyles()
    document.head.insertAdjacentHTML(
      'beforeend',
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="" />' +
        '<meta name="theme-color" media="not (prefers-color-scheme: light)" content="" />',
    )
    run()
    setTheme('light')
    await vi.waitFor(() =>
      expect(colors()).toEqual([hex('color.bg', 'light'), hex('color.bg', 'light')]),
    )
  })

  it('is left alone while the stylesheet is not there', async () => {
    run()
    setTheme('light')
    await nextFrame()
    expect(colors()).toEqual([])
  })
})

describe('the script for the head', () => {
  it('applies a remembered theme before the page renders', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    run()
    expect(root.dataset.theme).toBe('light')
  })

  it('leaves the page to the system when nothing is remembered, or something else is', () => {
    run()
    expect(root.dataset.theme).toBeUndefined()
    localStorage.setItem(THEME_STORAGE_KEY, 'solarized')
    run()
    expect(root.dataset.theme).toBeUndefined()
  })

  it('gives the bars the remembered theme once the stylesheet is there, before the first paint', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    // it runs before the stylesheet, so it waits for the frame that the stylesheet holds back
    run()
    expect(colors()).toEqual([])
    loadStyles()
    await nextFrame()
    expect(colors()).toEqual([hex('color.bg', 'light')])
  })

  it('keeps the bars in step with data-theme, whoever sets it', async () => {
    loadStyles()
    run()
    await nextFrame()
    expect(colors()).toEqual([hex('color.bg', 'dark')])
    // as the docs theme does, from VitePress's own switch
    root.dataset.theme = 'light'
    await vi.waitFor(() => expect(colors()).toEqual([hex('color.bg', 'light')]))
  })

  it("follows the system's theme while the page follows the system", async () => {
    loadStyles()
    run()
    await nextFrame()
    systemPrefers('light')
    for (const change of systemChanges) change()
    expect(colors()).toEqual([hex('color.bg', 'light')])
    // a theme chosen by hand holds when the system changes
    root.dataset.theme = 'light'
    systemPrefers('dark')
    for (const change of systemChanges) change()
    expect(colors()).toEqual([hex('color.bg', 'light')])
  })

  it('is also a file, for a page that loads it instead of inlining it', () => {
    // vitest runs from the repository root
    const file = readFileSync(join(process.cwd(), 'dist/theme/init.js'), 'utf8')
    expect(file).toContain(themeInitScript)
    expect(file).not.toMatch(/\bimport\b|\bexport\b/)
  })
})
