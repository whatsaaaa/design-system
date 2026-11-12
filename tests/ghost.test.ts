// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bubbleSize, bubbleSvg, lettersThatFit } from '../src/ghost/bubble.ts'
import {
  GHOST_HEIGHT,
  GHOST_WIDTH,
  PRESS_WINDOW,
  SHOUT_HOLD,
  WAG_HOLD,
  attachGhost,
  defineGhost,
  ghostMarkup,
  ghostSvg,
  shoutText,
} from '../src/ghost/index.ts'

function mount(attributes: Record<string, string> = {}) {
  const host = document.createElement('div')
  for (const [name, value] of Object.entries(attributes)) host.setAttribute(name, value)
  document.body.append(host)
  const detach = attachGhost(host)
  return {
    host,
    detach,
    button: host.querySelector('button')!,
    live: host.querySelector('.ws-ghost__live')!,
    bubble: host.querySelector<HTMLElement>('.ws-ghost__bubble')!,
  }
}

const reducedMotion = (reduce: boolean) =>
  vi
    .spyOn(window, 'matchMedia')
    .mockImplementation(
      (query) => ({ matches: reduce && query.includes('reduce') }) as MediaQueryList,
    )

/** happy-dom lays nothing out, so the window is as wide as a test says. */
let windowWidth = 1280
Object.defineProperty(document.documentElement, 'clientWidth', { get: () => windowWidth })

beforeEach(() => {
  vi.useFakeTimers()
  reducedMotion(false)
  windowWidth = 1280
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('the markup', () => {
  it('is a button with a label and the sprite, drawn without its margin', () => {
    const markup = ghostMarkup({ px: 6 })
    expect(markup).toMatch(
      /^<button type="button" class="ws-ghost__button" aria-label="The whatsaaaa ghost">/,
    )
    expect(markup).toContain(`viewBox="3 2 ${GHOST_WIDTH} ${GHOST_HEIGHT}" width="60" height="72"`)
    expect(markup).toContain('aria-hidden="true"')
  })

  it('escapes a label', () => {
    expect(ghostMarkup({ label: 'say "aaaa" & more' })).toContain(
      'aria-label="say &quot;aaaa&quot; &amp; more"',
    )
  })

  it('draws any pose as a picture', () => {
    expect(ghostSvg({ pose: 'lost' })).not.toBe(ghostSvg({ pose: 'idle' }))
    expect(ghostSvg()).toContain('width="20" height="24"')
  })

  it('is filled in by the element when the page did not render it', () => {
    const { host, button } = mount({ px: '4', label: 'Ghost' })
    expect(button.getAttribute('aria-label')).toBe('Ghost')
    expect(host.querySelector('svg')!.getAttribute('width')).toBe('40')
  })

  it('is kept when the page rendered it', () => {
    const host = document.createElement('div')
    host.innerHTML = ghostMarkup({ px: 6, label: 'From the server' })
    const rendered = host.querySelector('button')
    document.body.append(host)
    attachGhost(host)
    expect(host.querySelector('button')).toBe(rendered)
  })
})

describe('the easter egg', () => {
  it('wags the tongue on the first two presses, then shouts the handle', () => {
    const { host, button, live, bubble } = mount()
    expect(host.dataset.pose).toBe('idle')

    button.click()
    expect(host.dataset.pose).toBe('wag-left')
    button.click()
    expect(host.dataset.pose).toBe('wag-right')
    expect(bubble.dataset.open).toBeUndefined()

    button.click()
    expect(host.dataset.pose).toBe('shout')
    expect(live.textContent).toBe('whatsaaaa!')
    expect(bubble.dataset.open).toBe('')
    expect(bubble.querySelectorAll('.ws-ghost__bubble-text path')).toHaveLength('whatsaaaa!'.length)
  })

  it('holds the a one letter longer with every further press', () => {
    const { button } = mount()
    const shouts: string[] = []
    document.addEventListener('ws-ghost-shout', (event) =>
      shouts.push((event as CustomEvent).detail.text),
    )
    for (let press = 0; press < 6; press++) button.click()
    expect(shouts).toEqual(['whatsaaaa!', 'whatsaaaaa!', 'whatsaaaaaa!', 'whatsaaaaaaa!'])
  })

  it('announces the shout once, not every letter added to it', () => {
    const { button, live } = mount()
    for (let press = 0; press < 5; press++) button.click()
    expect(live.textContent).toBe('whatsaaaa!')
    expect(live.getAttribute('aria-live')).toBe('polite')
  })

  it('calms down after a while', () => {
    const { host, button, live, bubble } = mount()
    for (let press = 0; press < 3; press++) button.click()
    vi.advanceTimersByTime(SHOUT_HOLD - 1)
    expect(host.dataset.pose).toBe('shout')
    vi.advanceTimersByTime(1)
    expect(host.dataset.pose).toBe('idle')
    expect(live.textContent).toBe('')
    expect(bubble.dataset.open).toBeUndefined()
    expect(bubble.childElementCount).toBe(0)
  })

  it('puts the tongue back after a wag', () => {
    const { host, button } = mount()
    button.click()
    vi.advanceTimersByTime(WAG_HOLD)
    expect(host.dataset.pose).toBe('idle')
  })

  it('only counts presses that follow each other closely', () => {
    const { host, button } = mount()
    button.click()
    button.click()
    vi.setSystemTime(Date.now() + PRESS_WINDOW)
    button.click()
    expect(host.dataset.pose).toBe('wag-left')
  })

  it('starts over after it has calmed down', () => {
    const { host, button } = mount()
    for (let press = 0; press < 4; press++) button.click()
    vi.advanceTimersByTime(SHOUT_HOLD)
    button.click()
    expect(host.dataset.pose).toBe('wag-left')
  })

  it('keeps still with reduced motion until it shouts', () => {
    reducedMotion(true)
    const { host, button, live } = mount()
    button.click()
    button.click()
    expect(host.dataset.pose).toBe('idle')
    button.click()
    expect(host.dataset.pose).toBe('shout')
    expect(live.textContent).toBe('whatsaaaa!')
  })

  it('shouts at once and holds it when asked to', () => {
    const { host, live } = mount({ shout: '6' })
    expect(host.dataset.pose).toBe('shout')
    expect(live.textContent).toBe('whatsaaaaaa!')
    vi.advanceTimersByTime(SHOUT_HOLD * 3)
    expect(host.dataset.pose).toBe('shout')
  })

  it('stops growing before the bubble is wider than the window', () => {
    windowWidth = 200
    const { button, live, bubble } = mount()
    for (let press = 0; press < 12; press++) button.click()
    // the announcement keeps the first shout, the bubble is as long as the window allows
    expect(live.textContent).toBe('whatsaaaa!')
    const letters = bubble.querySelectorAll('.ws-ghost__bubble-text path').length
    expect(bubbleSize('x'.repeat(letters)).width * 2).toBeLessThanOrEqual(200 - 16)
    expect(letters).toBeGreaterThanOrEqual(shoutText(2).length)
  })

  it('never shouts more than sixteen a', () => {
    windowWidth = 4000
    const { button, bubble } = mount()
    for (let press = 0; press < 40; press++) button.click()
    expect(bubble.querySelectorAll('.ws-ghost__bubble-text path')).toHaveLength(
      shoutText(16).length,
    )
  })

  it('keeps the bubble with the ghost when the page moves under it', () => {
    const { button, bubble } = mount({ shout: '4' })
    let top = 300
    vi.spyOn(button, 'getBoundingClientRect').mockImplementation(
      () => ({ left: 100, top, right: 160, bottom: top + 72, width: 60, height: 72 }) as DOMRect,
    )
    vi.advanceTimersToNextFrame()
    // above the ghost: its top, less the gap, less the 18 font pixels of the bubble at 2 px each
    expect(bubble.style.top).toBe(`${300 - 4 - 36}px`)
    expect(bubble.style.left).toBe('133px')
    const drawing = bubble.firstElementChild

    // the page reflows: nothing scrolled and the window kept its size
    top = 437
    vi.advanceTimersToNextFrame()
    expect(bubble.style.top).toBe(`${437 - 4 - 36}px`)
    // it moved, it was not drawn again: its pop does not replay
    expect(bubble.firstElementChild).toBe(drawing)
  })

  it('draws the bubble again when it has to change sides', () => {
    const { button, bubble } = mount({ shout: '4' })
    let top = 300
    vi.spyOn(button, 'getBoundingClientRect').mockImplementation(
      () => ({ left: 100, top, right: 160, bottom: top + 72, width: 60, height: 72 }) as DOMRect,
    )
    vi.advanceTimersToNextFrame()
    expect(bubble.dataset.side).toBe('above')
    top = 10
    vi.advanceTimersToNextFrame()
    expect(bubble.dataset.side).toBe('below')
    expect(bubble.style.top).toBe(`${10 + 72 + 4}px`)
  })

  it('stops watching the ghost once the shout is over', () => {
    const { button } = mount()
    for (let press = 0; press < 3; press++) button.click()
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    vi.advanceTimersByTime(SHOUT_HOLD)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('leaves nothing behind when it is detached', () => {
    const { host, button, detach } = mount()
    for (let press = 0; press < 3; press++) button.click()
    detach()
    expect(host.querySelector('.ws-ghost__bubble')).toBeNull()
    expect(host.querySelector('.ws-ghost__live')).toBeNull()
    expect(host.dataset.pose).toBe('idle')
    button.click()
    expect(host.dataset.pose).toBe('idle')
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('<ws-ghost>', () => {
  it('registers once and behaves as the ghost while it is in the page', () => {
    defineGhost()
    defineGhost()
    const element = document.createElement('ws-ghost')
    element.setAttribute('px', '3')
    document.body.append(element)
    const button = element.querySelector('button')!
    for (let press = 0; press < 3; press++) button.click()
    expect(element.dataset.pose).toBe('shout')
    element.remove()
    expect(element.querySelector('.ws-ghost__bubble')).toBeNull()
  })
})

describe('the speech bubble', () => {
  it('is sized to its text', () => {
    expect(bubbleSize('whatsaaaa!')).toEqual({ width: 76, height: 18 })
    expect(lettersThatFit(76)).toBe(10)
    expect(bubbleSvg('whats!', 3, 'above')).toContain('width="144" height="54"')
  })

  it('points its tail at the speaker: down when above, up when below', () => {
    expect(bubbleSvg('a!', 2, 'above')).toContain('M3 15h3v1h-3zM2 16h2v1h-2zM1 17h1v1h-1z')
    expect(bubbleSvg('a!', 2, 'below')).toContain('M3 2h3v1h-3zM2 1h2v1h-2zM1 0h1v1h-1z')
    expect(bubbleSvg('a!', 2, 'above', 5)).toContain('M8 15h3v1h-3z')
  })

  it('has only the six letters of the shout', () => {
    expect(() => bubbleSvg('whats!', 2, 'above')).not.toThrow()
    expect(() => bubbleSvg('boo', 2, 'above')).toThrow('no glyph for "b"')
  })
})
