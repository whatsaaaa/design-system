<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** A sentence of a spec, with code between backticks as in Markdown. */
  text: string
}>()

// the odd pieces between the backticks are code
const pieces = computed(() => props.text.split('`'))
</script>

<template>
  <template v-for="(piece, index) in pieces" :key="index">
    <code v-if="index % 2">{{ piece }}</code>
    <template v-else>{{ piece }}</template>
  </template>
</template>
