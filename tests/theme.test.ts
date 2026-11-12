// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  getTheme,
  getThemeChoice,
  setTheme,
  themeInitScript,
  toggleTheme,
} from '../src/theme/index.ts'

const root = document.documentElement
const systemPrefers = (theme: 'dark' | 'light') =>
  vi
    .spyOn(window, 'matchMedia')
    .mockImplementation((query) => ({ matches: query.includes(theme) }) as MediaQueryList)

beforeEach(() => {
  localStorage.clear()
  delete root.dataset.theme
  systemPrefers('dark')
})
afterEach(() => vi.restoreAllMocks())

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

  it('tells the page when the theme changes', () => {
    const heard = vi.fn()
    document.addEventListener('ws-theme-change', (event) =>
      heard((event as CustomEvent).detail.theme),
    )
    setTheme('light')
    expect(heard).toHaveBeenCalledWith('light')
  })

  it('still switches when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => setTheme('light')).not.toThrow()
    expect(root.dataset.theme).toBe('light')
  })
})

describe('the script for the head', () => {
  const run = () => new Function(themeInitScript)()

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

  it('is also a file, for a page that loads it instead of inlining it', () => {
    // vitest runs from the repository root
    const file = readFileSync(join(process.cwd(), 'dist/theme/init.js'), 'utf8')
    expect(file).toContain(themeInitScript)
    expect(file).not.toMatch(/\bimport\b|\bexport\b/)
  })

  it.each(['terminal.html', 'prose.html'])(
    'runs in the example page %s before its stylesheet',
    (page) => {
      const html = readFileSync(join(process.cwd(), 'styleguide/public/examples', page), 'utf8')
      const script = html.indexOf('<script src="../ds/theme/init.js"></script>')
      expect(script).toBeGreaterThan(-1)
      expect(script).toBeLessThan(html.indexOf('rel="stylesheet"'))
    },
  )
})
