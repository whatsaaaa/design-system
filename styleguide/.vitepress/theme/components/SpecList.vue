<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/specs.data.ts'
import SpecText from './SpecText.vue'

const props = defineProps<{
  /** The component whose spec it shows. */
  of: string
  /** Which of its lists of sentences. */
  list: 'use' | 'notFor' | 'forcedColors' | 'motion' | 'content' | 'notes' | 'aria'
}>()

const items = computed(() => {
  const spec = data[props.of]!
  return props.list === 'aria' ? spec.aria.rules : (spec[props.list] ?? [])
})
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item"><SpecText :text="item" /></li>
  </ul>
</template>
