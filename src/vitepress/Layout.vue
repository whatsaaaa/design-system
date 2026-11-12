<script setup lang="ts">
import { inBrowser, useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { onMounted, onUnmounted, watchEffect } from 'vue'
import { defineGhost } from '../../dist/ghost/index.js'
import { enableShortcuts } from '../../dist/shortcuts/index.js'
import Crumb from './components/Crumb.vue'
import NavGhost from './components/NavGhost.vue'
import NotFound from './components/NotFound.vue'
import StatusLine from './components/StatusLine.vue'

const { isDark } = useData()

// VitePress marks dark with a class on <html>. The tokens read data-theme, so mirror it.
watchEffect(() => {
  if (inBrowser) document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
})

let disableShortcuts: (() => void) | undefined
onMounted(() => {
  defineGhost()
  // the tabs here are the links of the default theme's nav bar, numbered in nav.css
  disableShortcuts = enableShortcuts({
    tabs: '.VPNavBarMenu > .VPNavBarMenuLink, .VPNavBarMenu > .VPNavBarMenuGroup .button',
  })
})
onUnmounted(() => disableShortcuts?.())
</script>

<template>
  <DefaultTheme.Layout>
    <!-- every slot of the default theme stays open to a site that wraps this layout -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
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
