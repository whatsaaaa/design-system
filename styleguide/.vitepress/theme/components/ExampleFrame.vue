<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  /** Path of the example page, such as /examples/terminal.html */
  src: string
  title: string
  /** Height of the page inside the frame, in px. */
  height?: number
  /**
   * Width the page is laid out at, in px. A page wider than the column is scaled down to
   * fit, so a desktop layout can be shown in a narrow column. Without it the frame is as
   * wide as the column.
   */
  width?: number
}>()

const { isDark } = useData()
const box = ref<HTMLElement>()
const frame = ref<HTMLIFrameElement>()
const scale = ref(1)
const height = props.height ?? 560

/** The example is a page of its own. It takes the theme of the guide around it. */
function syncTheme() {
  const root = frame.value?.contentDocument?.documentElement
  if (root) root.dataset.theme = isDark.value ? 'dark' : 'light'
}
watch(isDark, syncTheme)

let observer: ResizeObserver | undefined
onMounted(() => {
  if (!props.width || !box.value) return
  const fit = () => {
    scale.value = Math.min(1, box.value!.clientWidth / props.width!)
  }
  observer = new ResizeObserver(fit)
  observer.observe(box.value)
  fit()
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <figure class="example">
    <div ref="box" class="box" :style="{ height: `${height * scale}px` }">
      <iframe
        ref="frame"
        :src="withBase(props.src)"
        :title="props.title"
        :style="{
          width: props.width ? `${props.width}px` : '100%',
          height: `${height}px`,
          transform: props.width ? `scale(${scale})` : undefined,
        }"
        loading="lazy"
        @load="syncTheme"
      />
    </div>
    <figcaption>
      <span>{{ props.title }}</span>
      <a :href="withBase(props.src)" target="_blank" rel="noopener">open on its own</a>
    </figcaption>
  </figure>
</template>

<style scoped>
.example {
  margin: var(--ws-space-16) 0 0;
  overflow: hidden;
  border: var(--ws-border-width-thin) solid var(--ws-color-border);
  border-radius: var(--ws-radius-lg);
}

.box {
  overflow: hidden;
  background: var(--ws-color-bg);
}

.example iframe {
  display: block;
  border: 0;
  transform-origin: 0 0;
}

.example figcaption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--ws-space-4) var(--ws-space-16);
  margin: 0;
  padding: var(--ws-space-8) var(--ws-space-12);
  border-top: var(--ws-border-width-thin) solid var(--ws-color-border);
  font: var(--ws-text-caption);
}
</style>
