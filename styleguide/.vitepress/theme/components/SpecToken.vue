<script setup lang="ts">
import type { Cell } from '../../data/specs.data.ts'

defineProps<{
  /** A row's token, or its value. */
  cell: Cell
  /** The token's id only, where there is no room for what it aliases. */
  short?: boolean
}>()
</script>

<template>
  <!-- a token by its id, which reads as its variable: button.primary.bg.rest is --ws-button-primary-bg-rest -->
  <span v-if="short" class="use" :title="cell.cssVar ?? cell.value">{{
    cell.token ?? 'no token'
  }}</span>
  <template v-else-if="cell.token">
    <code :title="cell.cssVar">{{ cell.token }}</code>
    <span v-if="cell.aliasOf" class="use">{{ cell.aliasOf }}</span>
  </template>
  <!-- a value that reads tokens, by their ids, with the CSS it is written as on hover -->
  <template v-else-if="cell.formula">
    <code :title="cell.value">{{ cell.formula }}</code>
    <span class="use">no token of its own</span>
  </template>
  <template v-else>
    <code>{{ cell.value }}</code>
    <span class="use">no token</span>
  </template>
</template>

<style scoped>
.use {
  display: block;
  margin-top: var(--ws-space-4);
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
  white-space: nowrap;
}
</style>
