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
  /** The document the keys are heard in. */
  root?: Document
  /** A selector for the tabs the number keys go to, in their order. */
  tabs?: string
}

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

function isVisible(element: Element): boolean {
  // an element that is not rendered has no boxes
  return element.getClientRects().length > 0
}

function targetFor(key: string, root: Document, tabSelector: string): HTMLElement | undefined {
  const declared = [...root.querySelectorAll<HTMLElement>('[data-ws-key]')].find(
    (element) =>
      element.dataset.wsKey === key &&
      !(element as HTMLButtonElement).disabled &&
      element.getAttribute('aria-disabled') !== 'true',
  )
  if (declared) return declared
  if (/^[1-9]$/.test(key)) {
    const tabs = [...root.querySelectorAll<HTMLElement>(tabSelector)].filter(isVisible)
    return tabs[Number(key) - 1]
  }
  return undefined
}

/**
 * Turns the shortcuts on and reveals the key hints. Returns a function that turns them off.
 * Keys typed into a field, and keys pressed with Ctrl, Alt or Cmd, are left alone.
 */
export function enableShortcuts({
  root = document,
  tabs = '.ws-tabs a',
}: ShortcutOptions = {}): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.target instanceof Element && event.target.closest(EDITABLE)) return
    const target = targetFor(event.key, root, tabs)
    if (!target) return
    event.preventDefault()
    target.click()
  }
  root.addEventListener('keydown', onKeyDown)
  root.documentElement.dataset.wsKeys = ''
  return () => {
    root.removeEventListener('keydown', onKeyDown)
    delete root.documentElement.dataset.wsKeys
  }
}
