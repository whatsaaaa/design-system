<script setup lang="ts">
import { inBrowser, useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { onMounted, onUnmounted, watchEffect } from 'vue'
import { defineGhost } from '../../dist/ghost/index.js'
import { enableShortcuts, isTyping, shortcutsOn } from '../../dist/shortcuts/index.js'
import Crumb from './components/Crumb.vue'
import NavGhost from './components/NavGhost.vue'
import NotFound from './components/NotFound.vue'
import StatusLine from './components/StatusLine.vue'

const { isDark } = useData()

/** The slots this layout fills itself. A site's content for them goes inside, next to the theme's. */
const OWN_SLOTS = ['nav-bar-content-after', 'doc-before', 'not-found', 'layout-bottom']

// VitePress marks dark with a dark class on <html> and light with no class, which the tokens
// read as the system's theme. So data-theme says both.
watchEffect(() => {
  if (inBrowser) document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
})

/**
 * VitePress listens for / itself, on the window, and opens the search. With the keys
 * switched off that key rests like the others, so it is stopped here on its way there.
 */
function restSearchKey(event: KeyboardEvent) {
  if (event.key !== '/' || shortcutsOn()) return
  if (event.target instanceof Element && isTyping(event.target)) return
  event.stopPropagation()
}

let disableShortcuts: (() => void) | undefined
onMounted(() => {
  defineGhost()
  // the tabs here are the links of the default theme's nav bar, numbered in nav.css
  disableShortcuts = enableShortcuts({
    tabs: '.VPNavBarMenu > .VPNavBarMenuLink, .VPNavBarMenu > .VPNavBarMenuGroup .button',
  })
  document.addEventListener('keydown', restSearchKey)
})
onUnmounted(() => {
  disableShortcuts?.()
  document.removeEventListener('keydown', restSearchKey)
})
</script>

<template>
  <DefaultTheme.Layout>
    <!-- every slot of the default theme stays open to a site that wraps this layout -->
    <template
      v-for="name in Object.keys($slots).filter((slot) => !OWN_SLOTS.includes(slot))"
      :key="name"
      #[name]="slotProps"
    >
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>

    <template #nav-bar-content-after>
      <NavGhost />
      <slot name="nav-bar-content-after" />
    </template>

    <template #doc-before>
      <Crumb />
      <slot name="doc-before" />
    </template>

    <template #not-found>
      <slot name="not-found"><NotFound /></slot>
    </template>

    <template #layout-bottom>
      <slot name="layout-bottom" />
      <StatusLine />
    </template>
  </DefaultTheme.Layout>
</template>
