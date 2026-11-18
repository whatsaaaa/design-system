<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/specs.data.ts'
import InlineCode from './InlineCode.vue'
import SpecText from './SpecText.vue'

const props = defineProps<{
  /** The component whose spec it shows. */
  of: string
}>()

const spec = computed(() => data[props.of]!)
const parity = { none: 'none yet', passing: 'passes', failing: 'fails' }
</script>

<template>
  <p class="lead"><SpecText :text="spec.summary" /></p>
  <p>
    <span class="ws-tag">{{ spec.status }}</span>
    Last changed in {{ spec.changed }}. The data is
    <InlineCode :text="`@whatsaaaa/design-system/specs/${spec.component}.spec.json`" />.
  </p>
  <div class="ws-table">
    <table>
      <thead>
        <tr>
          <th>Implementation</th>
          <th>Built on</th>
          <th>Ships it</th>
          <th>Parity test</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(implementation, name) in spec.implementations" :key="name">
          <td>
            <a :href="`#implementation-${name}`">{{ name }}</a>
          </td>
          <td class="ws-table__text">{{ implementation.library }}</td>
          <td>{{ implementation.status === 'shipped' ? 'yes' : 'planned' }}</td>
          <td>{{ parity[implementation.parity] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.lead {
  font: var(--ws-text-lead);
}
</style>
