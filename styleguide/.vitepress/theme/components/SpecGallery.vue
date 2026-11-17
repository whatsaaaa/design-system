<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/specs.data.ts'

const props = defineProps<{
  /** The component whose spec it shows. */
  of: string
}>()

const ids = computed(() => data[props.of]!.gallery)
</script>

<template>
  <ul class="ids">
    <li v-for="id in ids" :key="id">
      <code>{{ id }}</code>
    </li>
  </ul>
</template>

<style scoped>
/* in columns, so the examples of one kind read down */
.ids {
  padding: 0;
  columns: 14rem;
  column-gap: var(--ws-space-16);
  list-style: none;
}

.ids li {
  margin: 0 0 var(--ws-space-4);
  break-inside: avoid;
}
</style>
