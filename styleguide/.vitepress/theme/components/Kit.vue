<script setup lang="ts">
import { withBase } from 'vitepress'
import { computed } from 'vue'
import { data } from '../../data/kit.data.ts'

const props = defineProps<{
  /** Which identity's files: `whatsaaaa` or a project. */
  identity: string
  /** A pattern the file names have to match. */
  match: string
  /** Show previews as wide as the column, for banners. */
  wide?: boolean
}>()

const files = computed(() => {
  const pattern = new RegExp(props.match)
  return (data[props.identity] ?? []).filter((entry) => pattern.test(entry.file))
})
const url = (file: string) => withBase(`/kit/${props.identity}/${file}`)

/** The background a file is meant for, so each preview sits on the right one. */
function surface(file: string) {
  if (/-light\.|on-light/.test(file)) return 'light'
  if (/-dark\.|on-dark/.test(file)) return 'dark'
  return /mono/.test(file) ? 'page' : 'checker'
}
const previewable = (file: string) => !file.endsWith('.ico')
</script>

<template>
  <div class="kit" :class="{ wide }">
    <figure v-for="entry in files" :key="entry.file" class="card">
      <div
        class="preview"
        :class="surface(entry.file)"
        :data-theme="
          surface(entry.file) === 'light'
            ? 'light'
            : surface(entry.file) === 'dark'
              ? 'dark'
              : undefined
        "
      >
        <!-- an image cannot take the text color, so the one-color cut is drawn as a mask of it -->
        <span
          v-if="surface(entry.file) === 'page'"
          class="mono"
          role="img"
          :aria-label="entry.use"
          :style="{
            maskImage: `url(${url(entry.file)})`,
            width: `${entry.width}px`,
            height: `${entry.height}px`,
          }"
        />
        <img
          v-else-if="previewable(entry.file)"
          :src="url(entry.file)"
          :alt="entry.use"
          :width="entry.width"
          :height="entry.height"
        />
        <span v-else class="note">no preview</span>
      </div>
      <figcaption>
        <a :href="url(entry.file)" :download="`${identity}-${entry.file}`">{{ entry.file }}</a>
        <span class="size">{{ entry.width }} x {{ entry.height }}</span>
        <span class="use">{{ entry.use }}</span>
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.kit {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--ws-space-16);
  margin-top: var(--ws-space-16);
}

.kit.wide {
  grid-template-columns: minmax(0, 1fr);
}

.card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: var(--ws-border-width-thin) solid var(--ws-color-border);
  border-radius: var(--ws-radius-lg);
}

.preview {
  display: grid;
  place-items: center;
  min-height: 7rem;
  padding: var(--ws-space-20);
  background: var(--ws-color-bg);
  color: var(--ws-color-text);
}

/* a file made for any background is shown on both halves of one */
.preview.checker {
  background: linear-gradient(
    90deg,
    var(--ws-palette-main-base) 50%,
    var(--ws-palette-dawn-base) 50%
  );
}

.wide .preview {
  padding: var(--ws-space-16);
}

.preview img {
  max-width: 100%;
  height: auto;
  max-height: 8rem;
  image-rendering: pixelated;
}

.wide .preview img {
  max-height: none;
  image-rendering: auto;
}

.mono {
  display: block;
  background: currentcolor;
  mask-repeat: no-repeat;
  mask-size: contain;
}

.note {
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
}

.card figcaption {
  display: grid;
  gap: var(--ws-space-2);
  margin: 0;
  padding: var(--ws-space-10) var(--ws-space-12) var(--ws-space-12);
  border-top: var(--ws-border-width-thin) solid var(--ws-color-border);
  font: var(--ws-text-caption);
}

.card a {
  font-weight: var(--ws-font-weight-bold);
  overflow-wrap: anywhere;
}

.size {
  color: var(--ws-color-text-secondary);
}

.use {
  color: var(--ws-color-text);
  font-family: var(--ws-font-family-sans);
}
</style>
