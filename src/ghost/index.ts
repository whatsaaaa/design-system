/**
 * The ghost as a usable piece: static markup for any page, and the <ws-ghost> element with
 * the easter egg. Press the ghost three times in a row and it shouts the handle in a speech
 * bubble. Every further press holds the a for one letter longer.
 *
 * Everything here is safe to import on a server. Only `defineGhost()` needs a browser.
 */
import { GHOST_POSES, type GhostPose } from '../identity/ghost.ts'
import { spriteBounds, spritePaths } from '../identity/sprite.ts'
import { type BubbleSide, bubbleSize, bubbleSvg, lettersThatFit, maxTailShift } from './bubble.ts'

export type { GhostPose } from '../identity/ghost.ts'

/** The pixels the ghost occupies in its 16 x 16 grid. Every pose has the same outline. */
const BOUNDS = spriteBounds(GHOST_POSES.idle)

/** The ghost is this many sprite pixels wide and tall. */
export const GHOST_WIDTH = BOUNDS.width
export const GHOST_HEIGHT = BOUNDS.height

/** Presses have to follow each other within this many milliseconds to count as a row. */
export const PRESS_WINDOW = 1500
/** The shout starts at this press. The ones before it only wag the tongue. */
export const PRESSES_TO_SHOUT = 3
/** How long the tongue stays wagged, and how long the shout stays, in milliseconds. */
export const WAG_HOLD = 700
export const SHOUT_HOLD = 2600
/** The handle is shouted with at least this many a's, and at most this many. */
export const FIRST_SHOUT = 4
export const LONGEST_SHOUT = 16

/** The text of a shout with `count` a's. */
export const shoutText = (count: number) => `whats${'a'.repeat(count)}!`

export interface GhostSvgOptions {
  /** Size of one sprite pixel in CSS pixels. Whole numbers keep the sprite sharp. */
  px?: number
  pose?: GhostPose
}

/**
 * The free ghost as inline SVG, without its margin, so it sits in a line of text.
 * The body takes the text color and the tongue the brand color (see css/ghost.css).
 */
export function ghostSvg({ px = 2, pose = 'idle' }: GhostSvgOptions = {}): string {
  const { body, love } = spritePaths(GHOST_POSES[pose])
  return (
    `<svg class="ws-ghost__sprite" xmlns="http://www.w3.org/2000/svg" viewBox="${BOUNDS.x} ${BOUNDS.y} ${BOUNDS.width} ${BOUNDS.height}" width="${BOUNDS.width * px}" height="${BOUNDS.height * px}" shape-rendering="crispEdges" aria-hidden="true">` +
    `<path class="ws-ghost__body" d="${body}"/><path class="ws-ghost__tongue" d="${love}"/></svg>`
  )
}

export interface GhostMarkupOptions {
  px?: number
  /** What a screen reader calls the button. */
  label?: string
}

const DEFAULT_LABEL = 'The whatsaaaa ghost'
const escapeAttribute = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

/**
 * The inside of a <ws-ghost>, for rendering it on a server so the ghost is there before
 * any script runs. The element fills itself in when it is empty.
 */
export function ghostMarkup({ px = 2, label = DEFAULT_LABEL }: GhostMarkupOptions = {}): string {
  return `<button type="button" class="ws-ghost__button" aria-label="${escapeAttribute(label)}">${ghostSvg({ px })}</button>`
}

/** Space kept between the bubble and the edge of the window, and between bubble and ghost. */
const WINDOW_MARGIN = 8
const BUBBLE_GAP = 4

/**
 * Makes a host element behave as the ghost. Returns a function that undoes it.
 * <ws-ghost> calls this for itself. Call it directly to use another element as the host.
 *
 * Attributes of the host:
 * - `px`: size of one sprite pixel (default 2)
 * - `bubble-px`: size of one bubble pixel (default 2, or 3 for a ghost of 4 px and more)
 * - `bubble`: `above` or `below` to fix the side the bubble takes (default: above when it fits)
 * - `label`: what a screen reader calls the button
 * - `shout`: a number of a's. The ghost shouts at once and holds it, for showing the shout
 */
export function attachGhost(host: HTMLElement): () => void {
  const px = Number(host.getAttribute('px')) || 2
  const unit = Number(host.getAttribute('bubble-px')) || (px >= 4 ? 3 : 2)
  if (!host.querySelector('.ws-ghost__button'))
    host.innerHTML = ghostMarkup({ px, label: host.getAttribute('label') ?? undefined })
  const button = host.querySelector<HTMLButtonElement>('.ws-ghost__button')!
  const body = host.querySelector<SVGPathElement>('.ws-ghost__body')!
  const tongue = host.querySelector<SVGPathElement>('.ws-ghost__tongue')!
  const view = host.ownerDocument.defaultView!

  // the bubble is drawn for the eye, the live region carries the shout to screen readers
  const bubble = host.ownerDocument.createElement('span')
  bubble.className = 'ws-ghost__bubble'
  bubble.setAttribute('popover', 'manual')
  bubble.setAttribute('aria-hidden', 'true')
  const live = host.ownerDocument.createElement('span')
  live.className = 'ws-ghost__live'
  live.setAttribute('role', 'status')
  live.setAttribute('aria-live', 'polite')
  host.append(bubble, live)

  let presses = 0
  let lastPress = 0
  let shouting = ''
  let calm: ReturnType<typeof setTimeout> | undefined

  const pose = (name: GhostPose) => {
    const { body: bodyPath, love } = spritePaths(GHOST_POSES[name])
    body.setAttribute('d', bodyPath)
    tongue.setAttribute('d', love)
    host.dataset.pose = name
  }

  /** What the bubble shows now: its text, its side and where its tail is. */
  let drawn = ''
  /** Where the ghost was when the bubble was last placed. */
  let placedFor = ''
  let following = 0

  /** Puts the bubble next to the ghost: above it when there is room, and inside the window. */
  const place = () => {
    if (!shouting) return
    const ghost = button.getBoundingClientRect()
    const size = bubbleSize(shouting)
    const [width, height] = [size.width * unit, size.height * unit]
    const fixed = host.getAttribute('bubble')
    const side: BubbleSide =
      fixed === 'above' || fixed === 'below'
        ? fixed
        : ghost.top - BUBBLE_GAP - height >= WINDOW_MARGIN
          ? 'above'
          : 'below'
    const wanted = ghost.left + ghost.width * 0.55
    const windowWidth = host.ownerDocument.documentElement.clientWidth
    const left = Math.max(WINDOW_MARGIN, Math.min(wanted, windowWidth - WINDOW_MARGIN - width))
    // when the bubble had to move left, its tail moves right to stay at the ghost
    const tailShift = Math.max(
      0,
      Math.min(Math.round((wanted - left) / unit), maxTailShift(shouting)),
    )
    // Drawn again only when it looks different. Moving it must not replay its pop.
    const drawing = `${shouting}|${side}|${tailShift}`
    if (drawing !== drawn) {
      bubble.innerHTML = bubbleSvg(shouting, unit, side, tailShift)
      bubble.dataset.side = side
      drawn = drawing
    }
    bubble.style.left = `${Math.round(left)}px`
    bubble.style.top = `${Math.round(side === 'above' ? ghost.top - BUBBLE_GAP - height : ghost.bottom + BUBBLE_GAP)}px`
    placedFor = position()
  }

  const position = () => {
    const ghost = button.getBoundingClientRect()
    return `${ghost.left},${ghost.top},${ghost.width},${ghost.height},${host.ownerDocument.documentElement.clientWidth}`
  }

  /**
   * The bubble is drawn above the page, so nothing moves it along with the ghost. While it is
   * open it looks every frame where the ghost is and follows: a scroll, a window that
   * changes size, or a page that reflows when a font or an image arrives late.
   */
  const follow = () => {
    if (position() !== placedFor) place()
    following = view.requestAnimationFrame(follow)
  }

  const showBubble = () => {
    bubble.dataset.open = ''
    // a popover is drawn above everything and is never clipped
    if (typeof bubble.showPopover === 'function' && !bubble.matches(':popover-open'))
      bubble.showPopover()
    following = view.requestAnimationFrame(follow)
  }

  const hideBubble = () => {
    view.cancelAnimationFrame(following)
    if (typeof bubble.hidePopover === 'function' && bubble.matches(':popover-open'))
      bubble.hidePopover()
    delete bubble.dataset.open
    bubble.replaceChildren()
    drawn = ''
    placedFor = ''
  }

  const reset = () => {
    clearTimeout(calm)
    presses = 0
    shouting = ''
    hideBubble()
    live.textContent = ''
    pose('idle')
  }

  const shout = (count: number, hold: boolean) => {
    // the bubble never gets wider than the window: the shout stops growing instead
    const room = (host.ownerDocument.documentElement.clientWidth - 2 * WINDOW_MARGIN) / unit
    const most = Math.max(2, lettersThatFit(room) - shoutText(0).length)
    const text = shoutText(Math.min(count, most, LONGEST_SHOUT))
    const started = !shouting
    shouting = text
    pose('shout')
    if (started) {
      showBubble()
      // announced once, when the shout starts, not for every letter added to it
      live.textContent = text
    }
    place()
    host.dispatchEvent(new CustomEvent('ws-ghost-shout', { bubbles: true, detail: { text } }))
    clearTimeout(calm)
    if (!hold) calm = setTimeout(reset, SHOUT_HOLD)
  }

  const press = () => {
    const now = Date.now()
    presses = now - lastPress < PRESS_WINDOW ? presses + 1 : 1
    lastPress = now
    if (presses >= PRESSES_TO_SHOUT) return shout(FIRST_SHOUT + presses - PRESSES_TO_SHOUT, false)
    // The first presses only wag the tongue. With reduced motion the ghost keeps still.
    if (view.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    pose(presses === 1 ? 'wag-left' : 'wag-right')
    clearTimeout(calm)
    calm = setTimeout(reset, WAG_HOLD)
  }

  button.addEventListener('click', press)
  pose('idle')
  const held = Number(host.getAttribute('shout'))
  if (held > 0) shout(held, true)

  return () => {
    button.removeEventListener('click', press)
    reset()
    bubble.remove()
    live.remove()
  }
}

/**
 * Registers <ws-ghost>. Call it once in the browser. Does nothing on a server or when the
 * element is already registered.
 */
export function defineGhost(tag = 'ws-ghost'): void {
  if (typeof customElements === 'undefined' || customElements.get(tag)) return
  customElements.define(
    tag,
    class extends HTMLElement {
      #detach: (() => void) | undefined

      connectedCallback() {
        this.#detach = attachGhost(this)
      }

      disconnectedCallback() {
        this.#detach?.()
        this.#detach = undefined
      }
    },
  )
}
