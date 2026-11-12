<script setup lang="ts">
import { withBase } from 'vitepress'

defineProps<{ identity: string }>()

/** Sizes at which a sprite pixel is a whole number of screen pixels: 8, 4, 3, 2 and 1. */
const sizes = [128, 64, 48, 32, 16]
</script>

<template>
  <div class="strips">
    <div v-for="theme in ['dark', 'light'] as const" :key="theme" class="strip" :data-theme="theme">
      <span v-for="size in sizes" :key="size" class="cell">
        <img
          :src="withBase(`/kit/${identity}/mark.svg`)"
          :width="size"
          :height="size"
          :alt="`The ${identity} mark at ${size} px on a ${theme} background`"
        />
        <span class="label">{{ size }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.strips {
  display: grid;
  margin-top: var(--ws-space-16);
  overflow: hidden;
  border: var(--ws-border-width-thin) solid var(--ws-color-border);
  border-radius: var(--ws-radius-lg);
}

.strip {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--ws-space-24);
  padding: var(--ws-space-24);
  background: var(--ws-color-bg);
  color: var(--ws-color-text-secondary);
}

.cell {
  display: grid;
  justify-items: center;
  gap: var(--ws-space-8);
}

.cell img {
  display: block;
  image-rendering: pixelated;
}

.label {
  font: var(--ws-text-caption);
}
</style>
