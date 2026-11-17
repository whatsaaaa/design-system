<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/specs.data.ts'
import SpecToken from './SpecToken.vue'

const props = defineProps<{
  /** The component whose spec it shows. */
  of: string
}>()

const spec = computed(() => data[props.of]!)
const sizes = computed(() => Object.keys(spec.value.sizes) as (keyof typeof spec.value.sizes)[])
/** The kinds a row holds for, the shorter way: `primary, secondary` or `not quiet`. */
function kinds(variants: string[]) {
  const others = Object.keys(spec.value.variants).filter((kind) => !variants.includes(kind))
  return others.length < variants.length ? `not ${others.join(', ')}` : variants.join(', ')
}
</script>

<template>
  <p>
    What differs by size. The default is <code>{{ spec.defaultSize }}</code>, the size of an example
    whose id names none.
  </p>
  <div class="ws-table">
    <table>
      <thead>
        <tr>
          <th>Part and property</th>
          <th v-for="size in sizes" :key="size">
            {{ size }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in spec.sizeRows"
          :key="JSON.stringify([row.state, row.variants, row.targets])"
        >
          <td class="ws-table__text">
            <span
              v-for="target in row.targets"
              :key="`${target.part} ${target.property}`"
              class="target"
            >
              <code>{{ target.part }}</code> <code>{{ target.property }}</code>
            </span>
            <span v-if="row.pattern" class="use pattern">{{ row.pattern }}</span>
            <span v-if="row.variants" class="use">{{ kinds(row.variants) }}</span>
            <span v-if="row.state !== 'rest'" class="use">{{ row.state }}</span>
          </td>
          <td v-for="size in sizes" :key="size">
            <template v-if="row.cells[size]">
              <span class="value">{{ row.cells[size].dark.text }}</span>
              <SpecToken v-if="!row.pattern" :cell="row.cells[size]" short />
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* six columns of short values: a narrower padding keeps them in a column of text */
.ws-table :is(th, td) {
  padding-inline: var(--ws-space-6);
}

.ws-table :is(th, td):first-child {
  padding-inline-start: var(--ws-space-10);
}

.target {
  display: block;
  white-space: nowrap;
}

.target + .target {
  margin-top: var(--ws-space-4);
}

.value {
  font: var(--ws-text-label-sm);
}

.use {
  display: block;
  margin-top: var(--ws-space-4);
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
}

.pattern {
  white-space: nowrap;
}
</style>
