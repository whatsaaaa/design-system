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
</script>

<template>
  <p class="lead"><SpecText :text="spec.summary" /></p>
  <p>
    <span class="ws-tag">{{ spec.status }}</span>
    The data is
    <InlineCode :text="`@whatsaaaa/design-system/specs/${spec.component}.spec.json`" />.
  </p>
</template>

<style scoped>
.lead {
  font: var(--ws-text-lead);
}
</style>
