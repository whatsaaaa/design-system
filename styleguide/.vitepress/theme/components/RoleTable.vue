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
        </tr>
      </thead>
      <tbody>
        <tr v-for="role in rows" :key="role.id">
          <td class="token">
            <code>{{ role.cssVar }}</code>
            <span v-if="role.description" class="use">{{ role.description }}</span>
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
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* the first column holds the name and what it is for, so the table fits its column */
td.token {
  white-space: normal;
}

.use {
  display: block;
  margin-top: var(--ws-space-4);
}

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
</style>
