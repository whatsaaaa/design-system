<script setup lang="ts">
import { data } from '../../data/system.data.ts'

defineProps<{ variant: 'main' | 'dawn' }>()
</script>

<template>
  <div class="swatches">
    <div v-for="swatch in data.palette[variant]" :key="swatch.name" class="swatch">
      <span class="chip" :style="{ background: swatch.hex }" />
      <span class="name">{{ swatch.name }}</span>
      <code class="hex">{{ swatch.hex }}</code>
    </div>
  </div>
</template>

<style scoped>
.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  gap: var(--ws-space-12);
  margin-top: var(--ws-space-16);
}

.swatch {
  display: grid;
  gap: var(--ws-space-2);
  min-width: 0;
}

.chip {
  height: 3rem;
  margin-bottom: var(--ws-space-4);
  border: var(--ws-border-width-thin) solid var(--ws-color-border);
  border-radius: var(--ws-radius-md);
}

.name {
  font: var(--ws-text-label-sm);
  font-weight: var(--ws-font-weight-bold);
}

.swatch .hex {
  padding: 0;
  background: none;
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
}
</style>
