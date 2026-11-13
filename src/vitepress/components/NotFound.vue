<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { ghostSvg } from '../../../dist/ghost/index.js'
import { usePagePath } from '../path.ts'

const { site } = useData()
const path = usePagePath()
</script>

<template>
  <div class="WsNotFound">
    <!-- eslint-disable-next-line vue/no-v-html -- markup built by the ghost module, no user input -->
    <div class="WsNotFound-ghost" v-html="ghostSvg({ px: 8, pose: 'lost' })" />
    <h1 class="WsNotFound-title">404</h1>
    <p class="ws-prompt">cat /{{ path.replace(/\.md$/, '') }}</p>
    <p class="WsNotFound-output">No such file or directory</p>
    <p class="ws-prompt">
      <a :href="withBase(site.localeIndex === 'root' ? '/' : `/${site.localeIndex}/`)">cd ~</a>
      <span class="ws-prompt__comment"># back to the start</span>
    </p>
  </div>
</template>
