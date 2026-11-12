<script setup lang="ts">
import { type ContrastRow, data } from '../../data/system.data.ts'

const cssVar = (id: string) => `var(--ws-${id.replaceAll('.', '-')})`
const short = (id: string) => id.replace(/^color\./, '')
const themes = ['dark', 'light'] as const

function verdict(row: ContrastRow, theme: 'dark' | 'light') {
  const { passes, note } = row[theme]
  return passes ? 'passes' : note ? 'below' : 'fails'
}
</script>

<template>
  <div class="ws-table">
    <table>
      <thead>
        <tr>
          <th>Pair</th>
          <th>Bar</th>
          <th>Dark</th>
          <th>Light</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data.contrast" :key="row.foreground + row.background">
          <td class="pair">
            <code>{{ short(row.foreground) }}</code> on <code>{{ short(row.background) }}</code>
            <span class="use">{{ row.use }}</span>
            <span v-if="row.light.note" class="use">{{ row.light.note }}</span>
            <span v-if="row.dark.note" class="use">{{ row.dark.note }}</span>
          </td>
          <td class="number">{{ row.min }}</td>
          <td v-for="theme in themes" :key="theme">
            <span class="cell">
              <!-- each sample is drawn in its own theme, whatever theme the page is in -->
              <span class="sample" :data-theme="theme" aria-hidden="true">
                <span :style="{ background: cssVar(row.background), color: cssVar(row.foreground) }"
                  >Aa</span
                >
              </span>
              <span class="number">{{ row[theme].ratio.toFixed(2) }}</span>
              <span class="verdict" :class="verdict(row, theme)">{{ verdict(row, theme) }}</span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.cell {
  display: flex;
  align-items: center;
  gap: var(--ws-space-8);
  white-space: nowrap;
}

.sample {
  display: inline-flex;
  flex: none;
  overflow: hidden;
  border: var(--ws-border-width-thin) solid var(--ws-color-border-strong);
  border-radius: var(--ws-radius-sm);
  background: var(--ws-color-bg);
}

.sample > span {
  padding: 0 var(--ws-space-6);
  font: var(--ws-text-label-sm);
  font-weight: var(--ws-font-weight-bold);
}

.number {
  font: var(--ws-text-label-sm);
  font-variant-numeric: tabular-nums;
}

.verdict {
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
}

.verdict.fails {
  color: var(--ws-color-danger-text);
  font-weight: var(--ws-font-weight-bold);
}

/* the first column holds the pair and what it is for, so the table fits its column */
td.pair {
  white-space: normal;
}

.use {
  display: block;
  margin-top: var(--ws-space-4);
}
</style>
