import { type Page, expect, test } from '@playwright/test'
import { open } from './pages.ts'

/**
 * The path above a page title, as assistive technology reads it. Its parts stand in the markup
 * with nothing between them, and the slashes between them are drawn, so what separates them
 * for a screen reader comes from the styles.
 */

/** The text Chromium gives assistive technology for an element: its text, generated or not. */
async function spoken(page: Page, selector: string) {
  const client = await page.context().newCDPSession(page)
  const { root } = await client.send('DOM.getDocument')
  const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector })
  const { nodes } = await client.send('Accessibility.queryAXTree', { nodeId, role: 'StaticText' })
  return nodes.map((node) => String(node.name?.value ?? '')).join('')
}

/** The parts in order, each a word or words of its own: a space or punctuation between them. */
const apart = (parts: string[]) =>
  new RegExp(
    `^${parts.map((part) => part.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\p{P}]+')}$`,
    'u',
  )

test.describe('the path above a page title', () => {
  test('reads its parts as words of their own, as the usage guide writes it', async ({ page }) => {
    await open(page, '/examples/prose.html')
    expect(await spoken(page, '.ws-crumb')).toMatch(
      apart(['writing', 'form-builder', 'conditions']),
    )
  })

  test('reads its parts as words of their own in the docs theme', async ({ page }) => {
    await open(page, '/docs/sample/conditions')
    expect(await spoken(page, '.WsCrumb')).toMatch(
      apart(['docs', 'sample: form-builder', 'conditions']),
    )
  })
})
