// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  KEYS_STORAGE_KEY,
  enableShortcuts,
  isTyping,
  keysInitScript,
  shortcutsOn,
} from '../src/shortcuts/index.ts'

const root = document.documentElement
let disable: () => void
const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}
const element = (id: string) => document.getElementById(id)!
const flipSwitch = () => element('on').click()

beforeEach(() => {
  localStorage.clear()
  // happy-dom lays nothing out: treat every element as rendered
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
  document.body.innerHTML = `
    <nav class="ws-tabs"><ul>
      <li><a href="#one" id="one">one</a></li>
      <li><a href="#two" id="two">two</a></li>
    </ul></nav>
    <button type="button" data-ws-key="t" id="theme">theme</button>
    <button type="button" data-ws-key="j" id="down">down</button>
    <button type="button" data-ws-key="x" id="off" disabled>off</button>
    <button type="button" role="switch" data-ws-keys-switch id="keys">
      keys <span id="on">on</span><span>off</span>
    </button>
    <input id="field" />
    <div contenteditable="true" id="editor"></div>`
  disable = enableShortcuts()
})
afterEach(() => {
  disable()
  vi.restoreAllMocks()
})

const clicks = (id: string) => {
  const spy = vi.fn()
  element(id).addEventListener('click', (event) => {
    event.preventDefault()
    spy()
  })
  return spy
}

describe('shortcuts', () => {
  it('reveals the key hints and the switch while they are on', () => {
    expect(root.dataset.wsKeys).toBe('on')
    expect(shortcutsOn()).toBe(true)
    expect(element('keys').hasAttribute('aria-checked')).toBe(true)
    disable()
    expect(root.dataset.wsKeys).toBeUndefined()
    expect(shortcutsOn()).toBe(false)
    // the styles hide a switch that has no state
    expect(element('keys').hasAttribute('aria-checked')).toBe(false)
  })

  it('names the key of a control to assistive technology only while the key works', () => {
    expect(element('theme').getAttribute('aria-keyshortcuts')).toBe('t')
    flipSwitch()
    expect(element('theme').hasAttribute('aria-keyshortcuts')).toBe(false)
    flipSwitch()
    expect(element('theme').getAttribute('aria-keyshortcuts')).toBe('t')
    disable()
    expect(element('theme').hasAttribute('aria-keyshortcuts')).toBe(false)
  })

  it('clicks the control that declares the key', () => {
    const theme = clicks('theme')
    const event = press('t')
    expect(theme).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
  })

  it('leaves a key alone that nothing declares', () => {
    const theme = clicks('theme')
    const event = press('q')
    expect(theme).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('goes to a tab by its number', () => {
    const [one, two] = [clicks('one'), clicks('two')]
    press('2')
    expect(two).toHaveBeenCalledOnce()
    expect(one).not.toHaveBeenCalled()
    expect(press('3').defaultPrevented).toBe(false)
  })

  it.each(['field', 'editor'])('does nothing while typing in the %s', (id) => {
    const theme = clicks('theme')
    press('t', {}, element(id))
    expect(theme).not.toHaveBeenCalled()
  })

  it('says where keys are typed, for a status line that shows whether the hints work', () => {
    expect(isTyping(element('field'))).toBe(true)
    expect(isTyping(element('editor'))).toBe(true)
    expect(isTyping(element('theme'))).toBe(false)
    expect(isTyping(null)).toBe(false)
  })

  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }])(
    'does nothing with %o held',
    (modifier) => {
      const theme = clicks('theme')
      press('t', modifier)
      expect(theme).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['t', 'theme'],
    ['2', 'two'],
    ['j', 'down'],
  ])('acts once while %s is held: the repeats of the key do nothing', (key, id) => {
    const control = clicks(id)
    press(key)
    const repeats = [press(key, { repeat: true }), press(key, { repeat: true })]
    expect(control).toHaveBeenCalledOnce()
    // a repeat is still the page's key: the browser gets none of them
    expect(repeats.map((event) => event.defaultPrevented)).toEqual([true, true])
  })

  it('leaves the repeats of a key alone that nothing declares', () => {
    expect(press('q', { repeat: true }).defaultPrevented).toBe(false)
  })

  it('leaves a key alone while the control that shows its hint is not rendered', () => {
    const theme = clicks('theme')
    // what a browser reports for an element inside display: none
    vi.spyOn(element('theme'), 'getClientRects').mockReturnValue([] as unknown as DOMRectList)
    expect(press('t').defaultPrevented).toBe(false)
    expect(theme).not.toHaveBeenCalled()
  })

  it('skips a control that is disabled', () => {
    const off = clicks('off')
    expect(press('x').defaultPrevented).toBe(false)
    expect(off).not.toHaveBeenCalled()
  })

  it('takes the tabs of another bar when told where they are', () => {
    disable()
    document.body.insertAdjacentHTML(
      'beforeend',
      '<nav class="menu"><a href="#a" id="a">a</a><a href="#b" id="b">b</a></nav>',
    )
    disable = enableShortcuts({ tabs: '.menu > a' })
    const [b, two] = [clicks('b'), clicks('two')]
    press('2')
    expect(b).toHaveBeenCalledOnce()
    expect(two).not.toHaveBeenCalled()
  })

  it('stops when it is turned off', () => {
    const theme = clicks('theme')
    disable()
    press('t')
    expect(theme).not.toHaveBeenCalled()
  })
})

describe('the keys switch', () => {
  it('is on until the visitor switches it off, and says so', () => {
    expect(element('keys').getAttribute('aria-checked')).toBe('true')
    expect(localStorage.getItem(KEYS_STORAGE_KEY)).toBeNull()
  })

  it('turns every key off: the declared ones and the numbers of the tabs', () => {
    const [theme, two] = [clicks('theme'), clicks('two')]
    flipSwitch()
    expect(element('keys').getAttribute('aria-checked')).toBe('false')
    expect(root.dataset.wsKeys).toBe('off')
    expect(shortcutsOn()).toBe(false)
    expect(press('t').defaultPrevented).toBe(false)
    expect(press('2').defaultPrevented).toBe(false)
    expect(theme).not.toHaveBeenCalled()
    expect(two).not.toHaveBeenCalled()
  })

  it('turns them on again', () => {
    const theme = clicks('theme')
    flipSwitch()
    flipSwitch()
    expect(element('keys').getAttribute('aria-checked')).toBe('true')
    expect(root.dataset.wsKeys).toBe('on')
    press('t')
    expect(theme).toHaveBeenCalledOnce()
  })

  it('remembers off, and forgets it when the keys are on again', () => {
    flipSwitch()
    expect(localStorage.getItem(KEYS_STORAGE_KEY)).toBe('off')
    flipSwitch()
    expect(localStorage.getItem(KEYS_STORAGE_KEY)).toBeNull()
  })

  it('starts off when that is remembered, before a key can act', () => {
    disable()
    localStorage.setItem(KEYS_STORAGE_KEY, 'off')
    const theme = clicks('theme')
    disable = enableShortcuts()
    expect(element('keys').getAttribute('aria-checked')).toBe('false')
    expect(root.dataset.wsKeys).toBe('off')
    press('t')
    expect(theme).not.toHaveBeenCalled()
  })

  it('works where storage is blocked: on at first, and switched for this page', () => {
    disable()
    for (const method of ['getItem', 'setItem', 'removeItem'] as const)
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new Error('blocked')
      })
    const theme = clicks('theme')
    disable = enableShortcuts()
    press('t')
    expect(theme).toHaveBeenCalledOnce()
    expect(flipSwitch).not.toThrow()
    expect(element('keys').getAttribute('aria-checked')).toBe('false')
    press('t')
    expect(theme).toHaveBeenCalledOnce()
  })

  it('follows the switch of another tab or of an embedded page', () => {
    const theme = clicks('theme')
    localStorage.setItem(KEYS_STORAGE_KEY, 'off')
    window.dispatchEvent(new StorageEvent('storage', { key: KEYS_STORAGE_KEY }))
    expect(element('keys').getAttribute('aria-checked')).toBe('false')
    press('t')
    expect(theme).not.toHaveBeenCalled()
    // a change to something else in storage is not about the keys
    localStorage.removeItem(KEYS_STORAGE_KEY)
    window.dispatchEvent(new StorageEvent('storage', { key: 'ws-theme' }))
    expect(element('keys').getAttribute('aria-checked')).toBe('false')
  })

  it('gives a page without the switch no keys and no hints', () => {
    disable()
    element('keys').remove()
    const [theme, two] = [clicks('theme'), clicks('two')]
    disable = enableShortcuts()
    expect(root.dataset.wsKeys).toBeUndefined()
    expect(element('theme').hasAttribute('aria-keyshortcuts')).toBe(false)
    press('t')
    press('2')
    expect(theme).not.toHaveBeenCalled()
    expect(two).not.toHaveBeenCalled()
  })
})

describe('the script for the head', () => {
  const run = () => new Function(keysInitScript)()
  beforeEach(() => disable())

  it('marks the page before it renders when the keys are remembered as off', () => {
    localStorage.setItem(KEYS_STORAGE_KEY, 'off')
    run()
    expect(root.dataset.wsKeys).toBe('off')
  })

  it('marks the keys as pending when nothing is remembered, or something else is', () => {
    run()
    expect(root.dataset.wsKeys).toBe('pending')
    localStorage.setItem(KEYS_STORAGE_KEY, 'sometimes')
    run()
    expect(root.dataset.wsKeys).toBe('pending')
  })

  it('marks the keys as pending where storage is blocked, where they will be on', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(run).not.toThrow()
    expect(root.dataset.wsKeys).toBe('pending')
  })

  it('leaves pending to the module, which says on or off, or takes it away', () => {
    run()
    disable = enableShortcuts()
    expect(root.dataset.wsKeys).toBe('on')
    expect(shortcutsOn()).toBe(true)
    disable()
    run()
    // a page without the switch has no shortcuts, and nothing that names a key
    element('keys').remove()
    disable = enableShortcuts()
    expect(root.dataset.wsKeys).toBeUndefined()
  })

  it('does not count pending as on', () => {
    run()
    expect(shortcutsOn()).toBe(false)
  })

  it('is also a file, for a page that loads it instead of inlining it', () => {
    // vitest runs from the repository root
    const file = readFileSync(join(process.cwd(), 'dist/shortcuts/init.js'), 'utf8')
    expect(file).toContain(keysInitScript)
    expect(file).not.toMatch(/\bimport\b|\bexport\b/)
  })
})
