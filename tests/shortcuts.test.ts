// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableShortcuts, isTyping } from '../src/shortcuts/index.ts'

let disable: () => void
const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

beforeEach(() => {
  // happy-dom lays nothing out: treat every element as rendered
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
  document.body.innerHTML = `
    <nav class="ws-tabs"><ul>
      <li><a href="#one" id="one">one</a></li>
      <li><a href="#two" id="two">two</a></li>
    </ul></nav>
    <button type="button" data-ws-key="t" id="theme">theme</button>
    <button type="button" data-ws-key="x" id="off" disabled>off</button>
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
  document.getElementById(id)!.addEventListener('click', (event) => {
    event.preventDefault()
    spy()
  })
  return spy
}

describe('shortcuts', () => {
  it('reveals the key hints while they are on', () => {
    expect(document.documentElement.dataset.wsKeys).toBe('')
    disable()
    expect(document.documentElement.dataset.wsKeys).toBeUndefined()
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
    press('t', {}, document.getElementById(id)!)
    expect(theme).not.toHaveBeenCalled()
  })

  it('says where keys are typed, for a status line that shows whether the hints work', () => {
    expect(isTyping(document.getElementById('field'))).toBe(true)
    expect(isTyping(document.getElementById('editor'))).toBe(true)
    expect(isTyping(document.getElementById('theme'))).toBe(false)
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
