/** A path the way VitePress compares it: no query, hash or extension, and an index page as its folder. */
const normalize = (path: string) =>
  path.replace(/[?#].*$/, '').replace(/(?:(^|\/)index)?\.(?:md|html)$/, '$1')

const withoutSlash = (path: string) => path.replace(/\/$/, '')

/**
 * Whether a nav or sidebar link points at the page with this relative path.
 * With `asRegex` the link is the `activeMatch` pattern of a nav item.
 */
export function isActiveLink(relativePath: string, link: string, asRegex = false): boolean {
  const current = normalize(`/${relativePath}`)
  if (asRegex) return new RegExp(link).test(current)
  return withoutSlash(current) === withoutSlash(normalize(link.replace(/^\/?/, '/')))
}
