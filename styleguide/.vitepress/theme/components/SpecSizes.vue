<script setup lang="ts">
import { computed } from 'vue'
import type { Size } from '../../../../scripts/lib/specs.ts'
import { type SizeRow, data } from '../../data/specs.data.ts'
import InlineCode from './InlineCode.vue'
import SpecToken from './SpecToken.vue'

const props = defineProps<{
  /** The component whose spec it shows. */
  of: string
}>()

const spec = computed(() => data[props.of]!)
const sizes = computed(() => Object.keys(spec.value.sizes) as Size[])
/** A token as two halves a line can break between: `control.border-width.` and `invalid`. */
const head = (word: string) => word.slice(0, word.lastIndexOf('.') + 1)
const tail = (word: string) => word.slice(word.lastIndexOf('.') + 1)
/** Whether a sum has terms of each size's own, which its cells name before the row's. */
const owns = (row: SizeRow) => Object.keys(row.sum!.own).length > 0
/**
 * What a cell names under its value: the terms of a sum that are its own, or its token where the
 * row names none for every size.
 */
function named(row: SizeRow, size: Size) {
  if (row.sum) return row.sum.own[size]
  return !row.pattern || row.cells[size]!.token === undefined ? row.cells[size] : undefined
}
/** The kinds a row holds for, the shorter way: `primary, secondary` or `not quiet`. */
function kinds(variants: string[]) {
  const others = Object.keys(spec.value.variants).filter((kind) => !variants.includes(kind))
  return others.length < variants.length ? `not ${others.join(', ')}` : variants.join(', ')
}
</script>

<template>
  <p>
    What differs by size. The default is <InlineCode :text="spec.defaultSize" />, the size of an
    example whose id names none.
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
              :key="`${target.part} ${target.property} ${target.condition}`"
              class="target"
            >
              <code>{{ target.part }}</code> <code>{{ target.property }}</code>
              <span v-if="target.condition" class="condition">{{ target.condition }}</span>
            </span>
            <!-- a token breaks before its last name, where the table has no room -->
            <span v-if="row.pattern" class="use"
              ><span class="pattern">{{ head(row.pattern) }}</span><wbr /><span class="pattern">{{
                tail(row.pattern)
              }}</span></span
            >
            <!-- a sum: the tokens of each cell, then these, or these alone where no cell has any -->
            <span v-if="row.sum?.plus.length" class="use">
              {{ owns(row) ? 'plus' : '' }}
              <template v-for="(term, index) in row.sum.plus" :key="term">
                {{ index ? ' and ' : '' }}<span class="pattern">{{ head(term) }}</span><wbr /><span
                  class="pattern"
                  >{{ tail(term) }}</span
                >
              </template>
            </span>
            <!-- a term of several tokens breaks between them, or a token before its last name -->
            <span v-if="row.sum?.less.length" class="use">
              less
              <template v-for="(term, index) in row.sum.less" :key="term">
                {{ index ? ' and ' : '' }}
                <template v-for="(word, at) in term.split(' ')" :key="at"
                  >{{ at ? ' ' : '' }}<span class="pattern">{{ head(word) }}</span><wbr /><span
                    class="pattern"
                    >{{ tail(word) }}</span
                  ></template
                >
              </template>
            </span>
            <span v-if="row.variants" class="use">{{ kinds(row.variants) }}</span>
            <span v-if="row.state !== 'rest'" class="use">{{ row.state }}</span>
          </td>
          <td v-for="size in sizes" :key="size">
            <template v-if="row.cells[size]">
              <span class="value">{{ row.cells[size].dark.text }}</span>
              <!-- a sum of several tokens breaks as a row's does: between them, or a token before
                   its last name -->
              <span v-if="named(row, size)?.formula" class="use" :title="named(row, size)!.value">
                <template v-for="(word, at) in named(row, size)!.formula!.split(' ')" :key="at"
                  >{{ at ? ' ' : '' }}<span class="pattern">{{ head(word) }}</span><wbr /><span
                    class="pattern"
                    >{{ tail(word) }}</span
                  ></template
                >
              </span>
              <SpecToken v-else-if="named(row, size)" :cell="named(row, size)!" short />
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

/* a part and a property break between the two only where the table has no room */
.target {
  display: block;
}

.target + .target {
  margin-top: var(--ws-space-4);
}

.condition {
  display: block;
  margin-top: var(--ws-space-2);
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
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
