<script setup lang="ts">
import { computed } from 'vue'
import InlineCode from './InlineCode.vue'

const props = defineProps<{
  /** A sentence of a spec, with code between backticks as in Markdown. */
  text: string
}>()

// the odd pieces between the backticks are code
const pieces = computed(() => props.text.split('`'))
</script>

<template>
  <template v-for="(piece, index) in pieces" :key="index">
    <InlineCode v-if="index % 2" :text="piece" />
    <template v-else>{{ piece }}</template>
  </template>
</template>
