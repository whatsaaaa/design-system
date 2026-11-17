<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/specs.data.ts'
import SpecText from './SpecText.vue'

const props = defineProps<{
  /** The component whose spec it shows. */
  of: string
  /** Which of its named lists. */
  list: 'parts' | 'variants' | 'sizes' | 'states' | 'icons'
}>()

const heads = {
  parts: ['Part', 'What it is'],
  variants: ['Kind', 'What it is for'],
  sizes: ['Size', 'Where it is used'],
  states: ['State', 'When'],
  icons: ['Icon', 'Lucide name'],
}
const rows = computed(() => Object.entries(data[props.of]![props.list] ?? {}))
</script>

<template>
  <div class="ws-table">
    <table>
      <thead>
        <tr>
          <th>{{ heads[list][0] }}</th>
          <th>{{ heads[list][1] }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[name, text] in rows" :key="name">
          <td>
            <code>{{ name }}</code>
          </td>
          <td v-if="list === 'icons'">
            <code>{{ text }}</code>
          </td>
          <td v-else class="ws-table__text"><SpecText :text="text" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
