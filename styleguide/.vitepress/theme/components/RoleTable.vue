<script setup lang="ts">
import { computed } from 'vue'
import { type ColorValue, data } from '../../data/system.data.ts'

const props = defineProps<{
  /** `roles` change with the theme, `fixed` are the same in both. */
  group: 'roles' | 'fixed'
  /** Only the tokens whose id starts with this. */
  prefix?: string
}>()

const rows = computed(() =>
  data[props.group].filter((role) => !props.prefix || role.id.startsWith(props.prefix)),
)
const label = (value: ColorValue) =>
  value.from ? value.from.replace(/^(main|dawn)\./, '') : value.hex
</script>

<template>
  <div class="ws-table">
    <table>
      <thead>
        <tr>
          <th>Token</th>
          <th v-if="group === 'roles'">Dark</th>
          <th v-if="group === 'roles'">Light</th>
          <th v-else>Value</th>
          <th>Used for</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="role in rows" :key="role.id">
          <td>
            <code>{{ role.cssVar }}</code>
          </td>
          <td>
            <span class="value">
              <span class="chip" :style="{ background: role.dark.hex }" />
              <span>{{ label(role.dark) }}</span>
            </span>
          </td>
          <td v-if="group === 'roles'">
            <span class="value">
              <span class="chip" :style="{ background: role.light.hex }" />
              <span>{{ label(role.light) }}</span>
            </span>
          </td>
          <td class="use">{{ role.description }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.value {
  display: flex;
  align-items: center;
  gap: var(--ws-space-8);
  font: var(--ws-text-label-sm);
  white-space: nowrap;
}

.chip {
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  border: var(--ws-border-width-thin) solid var(--ws-color-border-strong);
  border-radius: var(--ws-radius-sm);
}

.use {
  min-width: 14rem;
}
</style>
