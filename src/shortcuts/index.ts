/**
 * Keyboard shortcuts that cannot lie. A shortcut is declared on the control it presses:
 *
 *   <button type="button" data-ws-key="t"><kbd class="ws-kbd">t</kbd>theme</button>
 *
 * Pressing t clicks that button, so the hint and the action are one element. The styles
 * keep key hints hidden until `enableShortcuts()` has run, so a page never shows a hint
 * for a key that does nothing.
 *
 * The number keys go to the tabs of a tab bar, which numbers them.
 */

export interface ShortcutOptions {
  /** A selector for the tabs the number keys go to, in their order. */
  tabs?: string
}

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

/** Whether keys pressed on this element are typed into a field. Shortcuts leave those alone. */
export function isTyping(element: Element | null): boolean {
  return !!element?.closest(EDITABLE)
}

function isVisible(element: Element): boolean {
  // an element that is not rendered has no boxes
  return element.getClientRects().length > 0
}

function targetFor(key: string, tabSelector: string): HTMLElement | undefined {
  const declared = [...document.querySelectorAll<HTMLElement>('[data-ws-key]')].find(
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
 * Turns the shortcuts on and reveals the key hints. Returns a function that turns them off.
 * A key works only while the control that shows its hint is rendered. Keys typed into a
 * field, and keys pressed with Ctrl, Alt or Cmd, are left alone.
 */
export function enableShortcuts({ tabs = '.ws-tabs a' }: ShortcutOptions = {}): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.target instanceof Element && isTyping(event.target)) return
    const target = targetFor(event.key, tabs)
    if (!target) return
    event.preventDefault()
    target.click()
  }
  document.addEventListener('keydown', onKeyDown)
  document.documentElement.dataset.wsKeys = ''
  return () => {
    document.removeEventListener('keydown', onKeyDown)
    delete document.documentElement.dataset.wsKeys
  }
}
