<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/system.data.ts'

const props = defineProps<{
  kind: 'fontSizes' | 'space' | 'radius' | 'borderWidth' | 'size' | 'duration' | 'easing'
}>()

const rows = computed(() => data[props.kind])
/** Sizes, durations and easings are listed. The rest can be drawn. */
const visual = computed(() => ['fontSizes', 'space', 'radius', 'borderWidth'].includes(props.kind))
</script>

<template>
  <div class="ws-table">
    <table>
      <thead>
        <tr>
          <th>Token</th>
          <th>Value</th>
          <th v-if="visual">Looks like</th>
          <th v-if="rows.some((row) => row.description)">Used for</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>
            <code>{{ row.cssVar }}</code>
          </td>
          <td class="value">{{ row.value }}</td>
          <td v-if="visual">
            <span v-if="kind === 'space'" class="bar" :style="{ width: `var(${row.cssVar})` }" />
            <span
              v-else-if="kind === 'radius'"
              class="corner"
              :style="{ borderRadius: `var(${row.cssVar})` }"
            />
            <span
              v-else-if="kind === 'borderWidth'"
              class="rule"
              :style="{ borderTopWidth: `var(${row.cssVar})` }"
            />
            <span
              v-else-if="kind === 'fontSizes'"
              class="letters"
              :style="{ fontSize: `var(${row.cssVar})` }"
            >
              Aa
            </span>
          </td>
          <td v-if="rows.some((entry) => entry.description)" class="ws-table__text">
            {{ row.description }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.value {
  font: var(--ws-text-label-sm);
  white-space: nowrap;
}

.bar {
  display: block;
  height: var(--ws-space-12);
  background: var(--ws-color-brand);
}

.corner {
  display: block;
  width: 3rem;
  height: 2rem;
  border: var(--ws-border-width-thin) solid var(--ws-color-field-border);
  background: var(--ws-color-raised);
}

.rule {
  display: block;
  width: 4rem;
  margin-top: var(--ws-space-10);
  border-top: 0 solid var(--ws-color-text);
}

.letters {
  font-family: var(--ws-font-family-mono);
  line-height: 1;
}
</style>
