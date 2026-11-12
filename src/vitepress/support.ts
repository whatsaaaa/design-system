const withoutExtension = (path: string) =>
  path
    .replace(/[?#].*$/, '')
    .replace(/(index)?\.(md|html)$/, '')
    .replace(/\/$/, '')

/**
 * Whether a nav or sidebar link points at the page with this relative path.
 * With `asRegex` the link is the `activeMatch` pattern of a nav item.
 */
export function isActiveLink(relativePath: string, link: string, asRegex = false): boolean {
  const current = '/' + withoutExtension(relativePath)
  if (asRegex) return new RegExp(link).test(current)
  const target = '/' + withoutExtension(link).replace(/^\//, '')
  return current === target
}
