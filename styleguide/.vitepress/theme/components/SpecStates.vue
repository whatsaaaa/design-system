<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/specs.data.ts'
import SpecToken from './SpecToken.vue'
import SpecValue from './SpecValue.vue'

const props = defineProps<{
  /** The component whose spec it shows. */
  of: string
}>()

const spec = computed(() => data[props.of]!)
</script>

<template>
  <div class="ws-table">
    <table>
      <thead>
        <tr>
          <th>State, part, property</th>
          <th>Token</th>
          <th>Dark, light</th>
        </tr>
      </thead>
      <!-- the rows of every kind first, then each kind's own -->
      <tbody v-for="group in spec.stateGroups" :key="group.variant ?? '*'">
        <tr class="group">
          <th colspan="3" scope="colgroup">{{ group.variant ?? 'every kind' }}</th>
        </tr>
        <tr v-for="row in group.rows" :key="`${row.state} ${row.part} ${row.property}`">
          <td class="ws-table__text">
            <span class="where">
              <code>{{ row.state }}</code> <code>{{ row.part }}</code>
              <code>{{ row.property }}</code>
            </span>
            <span v-if="group.variant && row.variants && row.variants.length > 1" class="use">
              also for {{ row.variants.filter((variant) => variant !== group.variant).join(', ') }}
            </span>
          </td>
          <td><SpecToken :cell="row.cell" /></td>
          <td><SpecValue :cell="row.cell" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.group th {
  padding-top: var(--ws-space-20);
  color: var(--ws-color-text);
}

.where {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ws-space-4);
}

.use {
  display: block;
  margin-top: var(--ws-space-4);
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
}
</style>
