import { useData } from 'vitepress'
import { computed, onMounted, ref } from 'vue'

/**
 * The path of the page's file, for the parts of the theme that show it.
 *
 * For a page that is not there the server knows only 404.md, and the browser knows the
 * address that was asked for. So on such a page the path is empty until the app is mounted:
 * the first render in the browser equals what the server sent, and the page never names a
 * path that is not the one in the address bar. VitePress makes that path from the whole
 * address, so on a site served from a base it starts with the base, which is taken off: the
 * path is the one inside the site, as on every other page.
 */
export function usePagePath() {
  const { page, site } = useData()
  const mounted = ref(false)
  onMounted(() => {
    mounted.value = true
  })
  return computed(() => {
    const { isNotFound, relativePath } = page.value
    if (!isNotFound) return relativePath
    if (!mounted.value) return ''
    // the base starts and ends with a slash, and the path has no slash at its start
    const base = site.value.base.slice(1)
    return relativePath.startsWith(base) ? relativePath.slice(base.length) : relativePath
  })
}
