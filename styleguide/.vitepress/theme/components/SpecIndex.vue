<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../../data/specs.data.ts'
import SpecText from './SpecText.vue'
</script>

<template>
  <div class="ws-table">
    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Status</th>
          <th>What it is</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="spec in data" :key="spec.component">
          <td>
            <a :href="withBase(`/components/${spec.component}`)">{{ spec.title }}</a>
          </td>
          <td>
            <span class="ws-tag">{{ spec.status }}</span>
          </td>
          <td class="ws-table__text"><SpecText :text="spec.summary" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
