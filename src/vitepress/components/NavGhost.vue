<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, h } from 'vue'
import { ghostMarkup, ghostSvg } from '../../../dist/ghost/index.js'
import type { ThemeConfig } from '../../../dist/vitepress-config/types.js'

const { theme } = useData<ThemeConfig>()
const mode = computed(() => theme.value.whatsaaaa?.ghost ?? 'link')
/** The handle's site, where the ghost on a project's docs links to. */
const home = 'https://whatsaaaa.github.io/'

// <ws-ghost> is a custom element. Rendered with h() it needs no compiler option in the site's
// config, and its inner markup comes with the page so the ghost is there before any script runs.
const Egg = () => h('ws-ghost', { px: 2, bubble: 'below', innerHTML: ghostMarkup({ px: 2 }) })
</script>

<template>
  <div class="WsNavGhost">
    <Egg v-if="mode === 'egg'" />
    <!-- eslint-disable-next-line vue/no-v-html -- markup built by the ghost module, no user input -->
    <a v-else :href="home" aria-label="A whatsaaaa project" v-html="ghostSvg({ px: 2 })" />
  </div>
</template>
