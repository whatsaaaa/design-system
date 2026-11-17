<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/specs.data.ts'
import SpecText from './SpecText.vue'

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
          <th>Keys</th>
          <th>What they do</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in spec.keyboard" :key="row.keys.join()">
          <td>
            <template v-for="(key, index) in row.keys" :key="key">
              <template v-if="index > 0">, </template>
              <kbd>{{ key }}</kbd>
            </template>
          </td>
          <td class="ws-table__text"><SpecText :text="row.effect" /></td>
        </tr>
      </tbody>
    </table>
  </div>
  <p>
    It follows <a :href="spec.aria.pattern">{{ spec.aria.pattern.replace(/^https:\/\//, '') }}</a>:
  </p>
</template>
