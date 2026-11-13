<script setup lang="ts">
import { h } from 'vue'
import { ghostMarkup } from '../../../../dist/ghost/index.js'

const props = defineProps<{
  /** Size of one sprite pixel. */
  px?: number
  /** Show the shout with this many a's and hold it. */
  shout?: number
}>()

const size = props.px ?? 8
// rendered with h() so the custom element needs no compiler option, with its markup in the page
const Ghost = () =>
  h('ws-ghost', {
    px: size,
    shout: props.shout,
    bubble: props.shout ? 'above' : undefined,
    innerHTML: ghostMarkup({ px: size }),
  })
</script>

<template>
  <div class="stage" :class="{ held: shout }">
    <Ghost />
    <p v-if="!shout" class="hint">Press it three times.</p>
  </div>
</template>

<style scoped>
.stage {
  display: flex;
  align-items: center;
  gap: var(--ws-space-24);
  margin-top: var(--ws-space-16);
  padding: var(--ws-space-56) var(--ws-space-32) var(--ws-space-32);
  border: var(--ws-border-width-thin) solid var(--ws-color-border);
  border-radius: var(--ws-radius-lg);
  background: var(--ws-color-surface);
}

/*
 * Room above the ghost for the bubble that is held open, and the padding of the frame above
 * that. At this size the bubble is 54 px tall and stands 4 px over the ghost.
 */
.stage.held {
  padding-top: calc(var(--ws-space-32) + 58px);
}

.stage .hint {
  margin: 0;
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-label);
}
</style>
