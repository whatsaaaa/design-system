<script setup lang="ts">
import type { Cell } from '../../data/specs.data.ts'

defineProps<{
  /** A row's token, or its value, with what it is in each theme. */
  cell: Cell
}>()

const themes = ['dark', 'light'] as const
</script>

<template>
  <span v-if="!cell.dark.color && cell.dark.text === cell.light.text" class="value">{{
    cell.dark.text
  }}</span>
  <span v-else class="themes">
    <span v-for="theme in themes" :key="theme" class="value">
      <!--
        Each color on the page of its own theme, whatever theme the page is in, so a tint shows
        as it is drawn.
      -->
      <span v-if="cell[theme].color" class="page" :data-theme="theme" aria-hidden="true">
        <span class="chip" :style="{ background: cell[theme].color }" />
      </span>
      {{ cell[theme].text }}
    </span>
  </span>
</template>

<style scoped>
.themes {
  display: grid;
  gap: var(--ws-space-4);
}

.value {
  display: flex;
  align-items: center;
  gap: var(--ws-space-8);
  font: var(--ws-text-label-sm);
  white-space: nowrap;
}

.page {
  display: flex;
  flex: none;
  padding: var(--ws-space-2);
  border: var(--ws-border-width-thin) solid var(--ws-color-border-strong);
  border-radius: var(--ws-radius-sm);
  background: var(--ws-color-bg);
}

.chip {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: var(--ws-radius-xs);
}
</style>
