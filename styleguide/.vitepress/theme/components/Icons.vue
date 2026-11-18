<script setup lang="ts">
import { data } from '../../data/system.data.ts'
import InlineCode from './InlineCode.vue'
</script>

<template>
  <div class="icons">
    <div v-for="icon in data.icons" :key="icon" class="icon">
      <span class="drawn" :style="{ maskImage: `var(${icon})` }" />
      <InlineCode class="name" :text="icon" />
    </div>
  </div>
</template>

<style scoped>
.icons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--ws-space-12);
  margin-top: var(--ws-space-16);
}

.icon {
  display: flex;
  align-items: center;
  gap: var(--ws-space-10);
  min-width: 0;
}

.drawn {
  flex: none;
  width: var(--ws-size-icon);
  height: var(--ws-size-icon);
  background: currentcolor;
  mask-position: center;
  mask-size: contain;
  mask-repeat: no-repeat;
}

.icon .name {
  padding: 0;
  background: none;
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
}
</style>
