/**
 * Keyboard shortcuts that cannot lie, and that a visitor can switch off.
 *
 * A shortcut is declared on the control it presses, with `data-ws-key`, so pressing the key
 * clicks that control and the hint and the action are one element. The number keys go to the
 * tabs of a tab bar, which numbers them. The switch, declared with `data-ws-keys-switch`,
 * turns every key off or on again, and the choice is kept in localStorage.
 *
 * The styles keep key hints and the numbers of the tabs hidden until `enableShortcuts()` has
 * run, so a page never shows a hint for a key that does nothing. For the same reason
 * `aria-keyshortcuts` is set here, while the key works, and not written in the markup. The
 * state of the switch, `aria-checked`, is set here too: the styles keep the switch hidden
 * until it has one, so it never shows a state that is not the real one. A key acts only on a
 * page that has that switch: a page without it has no shortcuts.
 *
 * A held key acts once. The repeats a keyboard sends while a key is down do nothing, so a
 * finger that rests on t does not flash the page between its themes.
 *
 * The markup and the rules for a page that uses this module are in docs/usage.md, section 7.
 */

export interface ShortcutOptions {
  /** A selector for the tabs the number keys go to, in their order. */
  tabs?: string
}

/** Where the choice is kept in localStorage. Nothing is stored while the keys are on. */
export const KEYS_STORAGE_KEY = 'ws-keys'

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]'
const DECLARED = '[data-ws-key]'
const SWITCH = '[data-ws-keys-switch]'

/** Whether keys pressed on this element are typed into a field. Shortcuts leave those alone. */
export function isTyping(element: Element | null): boolean {
  return !!element?.closest(EDITABLE)
}

/** Whether single keys are shortcuts on this page right now: turned on, and not switched off. */
export function shortcutsOn(): boolean {
  return document.documentElement.dataset.wsKeys === 'on'
}

function isVisible(element: Element): boolean {
  // an element that is not rendered has no boxes
  return element.getClientRects().length > 0
}

function rememberedOff(): boolean {
  try {
    return localStorage.getItem(KEYS_STORAGE_KEY) === 'off'
  } catch {
    // storage can be blocked. The keys are then on, and the switch holds for this page.
    return false
  }
}

function remember(on: boolean): void {
  try {
    if (on) localStorage.removeItem(KEYS_STORAGE_KEY)
    else localStorage.setItem(KEYS_STORAGE_KEY, 'off')
  } catch {
    // the choice still holds for this page
  }
}

function targetFor(key: string, tabSelector: string): HTMLElement | undefined {
  const declared = [...document.querySelectorAll<HTMLElement>(DECLARED)].find(
    (element) =>
      element.dataset.wsKey === key &&
      isVisible(element) &&
      !(element as HTMLButtonElement).disabled &&
      element.getAttribute('aria-disabled') !== 'true',
  )
  if (declared) return declared
  if (/^[1-9]$/.test(key)) {
    const tabs = [...document.querySelectorAll<HTMLElement>(tabSelector)].filter(isVisible)
    return tabs[Number(key) - 1]
  }
  return undefined
}

/**
 * Turns the shortcuts on, unless the visitor has switched them off, and wires the switch.
 * Returns a function that takes all of it away again. Call it once the status line is in
 * the page.
 *
 * A key works only while the control that shows its hint is rendered and the page has the
 * switch, and a held key works once. Keys typed into a field, and keys pressed with Ctrl,
 * Alt or Cmd, are left alone.
 */
export function enableShortcuts({ tabs = '.ws-tabs a' }: ShortcutOptions = {}): () => void {
  const root = document.documentElement
  const switches = () => [...document.querySelectorAll(SWITCH)]
  let on = !rememberedOff()

  /**
   * Says on the page what `on` holds: the styles show the hints by it, the switch has its
   * state, and a control names its key to assistive technology only while the key works.
   */
  const show = () => {
    const controls = switches()
    const live = on && controls.length > 0
    for (const control of controls) control.setAttribute('aria-checked', String(on))
    for (const control of document.querySelectorAll<HTMLElement>(DECLARED)) {
      if (live) control.setAttribute('aria-keyshortcuts', control.dataset.wsKey!)
      else control.removeAttribute('aria-keyshortcuts')
    }
    if (controls.length > 0) root.dataset.wsKeys = on ? 'on' : 'off'
    else delete root.dataset.wsKeys
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!on || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.target instanceof Element && isTyping(event.target)) return
    if (switches().length === 0) return
    const target = targetFor(event.key, tabs)
    if (!target) return
    event.preventDefault()
    // the repeats of a held key are the page's too, and do nothing
    if (!event.repeat) target.click()
  }
  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || !event.target.closest(SWITCH)) return
    on = !on
    remember(on)
    show()
  }
  // another tab or an embedded page of the same site flipped the switch
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEYS_STORAGE_KEY && event.key !== null) return
    on = !rememberedOff()
    show()
  }

  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('click', onClick)
  window.addEventListener('storage', onStorage)
  show()
  return () => {
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('click', onClick)
    window.removeEventListener('storage', onStorage)
    for (const control of switches()) control.removeAttribute('aria-checked')
    for (const control of document.querySelectorAll(DECLARED))
      control.removeAttribute('aria-keyshortcuts')
    delete root.dataset.wsKeys
  }
}

/**
 * A script for the <head> that marks the page before the first paint: `off` when the keys
 * are remembered as off, and `pending` otherwise, until `enableShortcuts()` says on or off.
 * With off the styles leave out what names a key, the numbers of the tabs among it, from the
 * start instead of taking it away. With pending the numbers keep their place unseen, so the
 * labels of the tabs do not move when the module shows them.
 *
 *   <script>{keysInitScript}</script>
 */
export const keysInitScript = `(function(){var keys='pending';try{if(localStorage.getItem(${JSON.stringify(KEYS_STORAGE_KEY)})==='off')keys='off'}catch(e){}document.documentElement.dataset.wsKeys=keys})()`
