<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/specs.data.ts'
import SpecText from './SpecText.vue'

const props = defineProps<{
  /** The component whose spec it shows. */
  of: string
}>()

const spec = computed(() => data[props.of]!)
const attributes = (values: Record<string, string | boolean>) =>
  Object.entries(values)
    .map(([name, value]) => (value === true ? name : `${name}="${value}"`))
    .join(' ')
/** The spec's names and the implementation's for them: parts, kinds and sizes. */
const mappings = (implementation: (typeof spec.value.implementations)[string]) => [
  ...Object.entries(implementation.parts ?? {}).map(([name, slot]) => ({
    what: 'part',
    name,
    as: `slot ${slot}`,
  })),
  ...Object.entries(implementation.variants ?? {}).map(([name, values]) => ({
    what: 'kind',
    name,
    as: attributes(values),
  })),
  ...Object.entries(implementation.sizes ?? {}).map(([name, values]) => ({
    what: 'size',
    name,
    as: attributes(values),
  })),
]
</script>

<template>
  <template v-for="(implementation, name) in spec.implementations" :key="name">
    <h3 :id="`implementation-${name}`" tabindex="-1">{{ name }}</h3>
    <p>
      {{ implementation.library
      }}<template v-if="implementation.components"
        >, with
        <template v-for="(component, index) in implementation.components" :key="component">
          <template v-if="index > 0"> and </template><code>{{ component }}</code>
        </template></template
      >.
      <template v-if="implementation.status === 'planned'">Planned.</template>
      <SpecText v-else :text="implementation.today!" />
    </p>
    <div v-if="implementation.status === 'shipped'" class="ws-table">
      <table>
        <thead>
          <tr>
            <th>In the spec</th>
            <th>In {{ name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in mappings(implementation)" :key="`${row.what} ${row.name}`">
            <td>{{ row.what }} <code>{{ row.name }}</code></td>
            <td>
              <code>{{ row.as }}</code>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <template v-if="implementation.deviations?.length">
      <p>Where it does not meet the spec yet:</p>
      <ul>
        <li v-for="deviation in implementation.deviations" :key="deviation.summary">
          <SpecText :text="deviation.summary" />
          <a v-if="deviation.issue" :href="deviation.issue">Issue</a>
        </li>
      </ul>
    </template>
    <template v-if="implementation.beyond?.length">
      <p>What it draws beyond the spec, which keeps working but is not checked:</p>
      <ul>
        <li v-for="item in implementation.beyond" :key="item"><SpecText :text="item" /></li>
      </ul>
    </template>
  </template>
</template>
