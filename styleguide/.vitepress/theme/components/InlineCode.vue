<script setup lang="ts">
import { computed } from 'vue'
import { codeParts } from '../../../../src/vitepress-config/markdown.ts'

const props = defineProps<{
  /** The code, shown on a chip as Markdown shows inline code. */
  text: string
}>()

// held at its hyphens and broken after the slashes of a path, as inline code of a Markdown page
const parts = computed(() => codeParts(props.text))
</script>

<template>
  <code
    ><template v-for="(part, index) in parts" :key="index"
      ><wbr v-if="part.kind === 'break'" /><span
        v-else-if="part.kind === 'joined'"
        class="ws-code-joined"
        >{{ part.text }}</span
      ><template v-else>{{ part.text }}</template></template
    ></code
  >
</template>
