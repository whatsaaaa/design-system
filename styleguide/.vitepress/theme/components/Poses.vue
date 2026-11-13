<script setup lang="ts">
import { type GhostPose, ghostSvg } from '../../../../dist/ghost/index.js'

const poses: { pose: GhostPose; use: string }[] = [
  { pose: 'idle', use: 'The mark itself' },
  { pose: 'blink', use: 'Eyes half shut' },
  { pose: 'wag-left', use: 'First press of the easter egg' },
  { pose: 'wag-right', use: 'Second press' },
  { pose: 'shout', use: 'The shout' },
  { pose: 'lost', use: 'A page that is not there' },
]
</script>

<template>
  <div class="poses">
    <figure v-for="{ pose, use } in poses" :key="pose" class="pose">
      <!-- eslint-disable-next-line vue/no-v-html -- markup built by the ghost module -->
      <div class="sprite" v-html="ghostSvg({ px: 6, pose })" />
      <figcaption>
        <code>{{ pose }}</code>
        <span>{{ use }}</span>
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.poses {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: var(--ws-space-16);
  margin-top: var(--ws-space-16);
}

.pose {
  display: grid;
  align-content: start;
  justify-items: center;
  gap: var(--ws-space-12);
  margin: 0;
  padding: var(--ws-space-20) var(--ws-space-12) var(--ws-space-16);
  border: var(--ws-border-width-thin) solid var(--ws-color-border);
  border-radius: var(--ws-radius-lg);
}

.sprite {
  color: var(--ws-color-text);
  line-height: 0;
}

.pose figcaption {
  display: grid;
  justify-items: center;
  gap: var(--ws-space-4);
  margin: 0;
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
  font-family: var(--ws-font-family-sans);
  text-align: center;
}
</style>
