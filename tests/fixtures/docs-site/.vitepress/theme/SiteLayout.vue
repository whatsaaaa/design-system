<script setup lang="ts">
import DocsTheme from '../../../../../src/vitepress/index.ts'
</script>

<!-- A site that wraps the theme's layout to add to slots, the ones the theme fills among them. -->
<template>
  <DocsTheme.Layout>
    <template #nav-bar-content-after><span id="site-nav">sto za dvoje</span></template>
    <template #doc-before><p id="site-doc-before">Otvoreno od osam.</p></template>
    <template #doc-after><p id="site-doc-after">Vidimo se u Čačku.</p></template>
    <template #layout-bottom><p id="site-bottom">kafana, Niš</p></template>
  </DocsTheme.Layout>
</template>
