<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { isTyping } from '../../../dist/shortcuts/index.js'
import type { ThemeConfig } from '../../../dist/vitepress-config/types.js'
import { usePagePath } from '../path.ts'

const { theme, isDark } = useData<ThemeConfig>()

/**
 * NORMAL while single keys are shortcuts, INSERT while they are typed into a field.
 * It says whether the key hints next to it work right now.
 */
const mode = ref<'NORMAL' | 'INSERT'>('NORMAL')
/** Where the page is scrolled to, the way an editor shows it: top, a percentage, bot. */
const position = ref('top')

const hasSearch = computed(() => !!theme.value.search?.provider)
/** The file of the page. Not known yet on the first render of a page that is not there. */
const file = usePagePath()

function updateMode() {
  mode.value = isTyping(document.activeElement) ? 'INSERT' : 'NORMAL'
}

function updatePosition() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  if (scrollable <= 0 || window.scrollY <= 0) position.value = 'top'
  else if (window.scrollY >= scrollable - 1) position.value = 'bot'
  else position.value = `${Math.round((window.scrollY / scrollable) * 100)}%`
}

function openSearch() {
  document.querySelector<HTMLButtonElement>('.VPNavBarSearch .DocSearch-Button')?.click()
}

function scrollPage(direction: 1 | -1) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollBy({
    top: direction * Math.round(window.innerHeight * 0.4),
    behavior: reduce ? 'auto' : 'smooth',
  })
}

function toggleTheme() {
  isDark.value = !isDark.value
}

onMounted(() => {
  updateMode()
  updatePosition()
  document.addEventListener('focusin', updateMode)
  document.addEventListener('focusout', updateMode)
  window.addEventListener('scroll', updatePosition, { passive: true })
  window.addEventListener('resize', updatePosition)
})
onUnmounted(() => {
  document.removeEventListener('focusin', updateMode)
  document.removeEventListener('focusout', updateMode)
  window.removeEventListener('scroll', updatePosition)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <footer class="ws-status-line WsStatusLine" aria-label="Status">
    <span class="ws-status-line__mode">{{ mode }}</span>
    <span v-if="file" class="ws-status-line__file"><span>{{ file }}</span></span>
    <span v-if="theme.whatsaaaa?.branch" class="ws-status-line__item ws-status-line__item--wide">
      {{ theme.whatsaaaa.branch }}
    </span>
    <span class="ws-status-line__spacer" />
    <!-- Each hint is the control it names: the key clicks the button. -->
    <span class="ws-status-line__keys">
      <button
        v-if="hasSearch"
        type="button"
        data-ws-key="/"
        aria-label="Search"
        @click="openSearch"
      >
        <kbd class="ws-kbd">/</kbd>search
      </button>
      <span class="WsStatusLine-pair">
        <button type="button" data-ws-key="j" aria-label="Scroll down" @click="scrollPage(1)">
          <kbd class="ws-kbd">j</kbd>
        </button>
        <button type="button" data-ws-key="k" aria-label="Scroll up" @click="scrollPage(-1)">
          <kbd class="ws-kbd">k</kbd>
        </button>
        <span aria-hidden="true">scroll</span>
      </span>
      <button type="button" data-ws-key="t" aria-label="Switch theme" @click="toggleTheme">
        <kbd class="ws-kbd">t</kbd>theme
      </button>
    </span>
    <!--
      The shortcuts module flips this switch and gives it its state, in the browser. Until
      then it is hidden, so nothing here depends on what the browser remembers.
    -->
    <button
      type="button"
      class="ws-status-line__switch"
      role="switch"
      aria-label="Shortcut keys"
      data-ws-keys-switch
    >
      keys
      <span class="ws-status-line__on" aria-hidden="true">on</span>
      <span class="ws-status-line__off" aria-hidden="true">off</span>
    </button>
    <span class="ws-status-line__item ws-status-line__item--edge">{{ position }}</span>
    <!--
      Both names are rendered and the styles show the one of the page's theme. The theme is
      not known on the server, so a name rendered from it would differ in the browser.
    -->
    <span
      class="ws-status-line__item ws-status-line__item--edge ws-status-line__item--wide ws-status-line__item--dark"
    >
      rose-pine
    </span>
    <span
      class="ws-status-line__item ws-status-line__item--edge ws-status-line__item--wide ws-status-line__item--light"
    >
      rose-pine-dawn
    </span>
  </footer>
</template>
