<script setup lang="ts">
import { type DefaultTheme, useData } from 'vitepress'
import { useSidebar } from 'vitepress/theme-without-fonts'
import { computed } from 'vue'
import { isActiveLink } from '../support.ts'
import type { ThemeConfig } from '../../../dist/vitepress-config/types.js'

const { theme, page, frontmatter } = useData<ThemeConfig>()
const { sidebarGroups } = useSidebar()

/** The path to this page: its tab, its group in the sidebar, then the page itself. */
const trail = computed(() => {
  const path = page.value.relativePath
  const tab = (theme.value.nav ?? []).find(
    (item): item is DefaultTheme.NavItemWithLink =>
      'link' in item && isActiveLink(path, item.activeMatch ?? item.link, !!item.activeMatch),
  )
  const group = sidebarGroups.value.find((candidate) =>
    (candidate.items ?? []).some((item) => item.link && isActiveLink(path, item.link)),
  )
  // a tab and a group often share a name. The path is shown in lowercase, so compare that way
  const parts = [tab?.text, group?.text, page.value.title].filter((part): part is string => !!part)
  const lower = parts.map((part) => part.toLowerCase())
  return parts.filter((_, index) => lower.indexOf(lower[index]!) === index)
})
</script>

<template>
  <p v-if="trail.length > 1 && frontmatter.crumb !== false" class="ws-crumb WsCrumb">
    <span v-for="part in trail" :key="part">{{ part }}</span>
  </p>
</template>
