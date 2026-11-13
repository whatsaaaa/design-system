import { useData } from 'vitepress'
import { computed, onMounted, ref } from 'vue'

/**
 * The path of the page's file, for the parts of the theme that show it.
 *
 * For a page that is not there the server knows only 404.md, and the browser knows the
 * address that was asked for. So on such a page the path is empty until the app is mounted:
 * the first render in the browser equals what the server sent, and the page never names a
 * path that is not the one in the address bar.
 */
export function usePagePath() {
  const { page } = useData()
  const mounted = ref(false)
  onMounted(() => {
    mounted.value = true
  })
  return computed(() => (page.value.isNotFound && !mounted.value ? '' : page.value.relativePath))
}
