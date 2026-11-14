<script setup lang="ts">
import { data } from '../../data/system.data.ts'

/** What each style is shown with: the kind of text it is made for. */
const samples: Record<string, string> = {
  'text.display': 'whatsaaaa',
  'text.display-compact': 'whatsaaaa',
  'text.h1': 'Conditions',
  'text.h1-compact': 'Conditions',
  'text.h2': 'Adding the extension',
  'text.h2-compact': 'Adding the extension',
  'text.h3': 'Operators by kind',
  'text.h4': 'form-builder',
  'text.tagline': 'Building things end to end.',
  'text.tagline-compact': 'Building things end to end.',
  'text.lead':
    'A field, a section or a step shows, hides, or hides and clears its value, by the values of other fields.',
  'text.body': 'A condition tests one field, by its dot path, with exactly one operator.',
  'text.body-sm': 'Describe forms in JSON and get validated Formisch forms out.',
  'text.label': 'ls ~/projects',
  'text.label-sm': 'Validation rules',
  'text.caption': 'guide/conditions.md',
  'text.overline': 'On this page',
  'text.code': 'const schema = builder.build(definition)',
}
</script>

<template>
  <div class="specimens">
    <div v-for="style in data.text" :key="style.id" class="specimen">
      <p
        class="sample"
        :class="{ upper: style.id === 'text.overline' }"
        :style="{
          font: `var(${style.cssVar})`,
          letterSpacing: `var(${style.cssVar}-letter-spacing)`,
        }"
      >
        {{ samples[style.id] ?? style.description }}
      </p>
      <p class="meta">
        <code>{{ style.cssVar }}</code>
        <span
          >{{ style.family }} {{ style.weight }}, {{ style.size }} / {{ style.lineHeight
          }}<template v-if="parseFloat(style.tracking) !== 0"
            >, tracking {{ style.tracking }}</template
          ></span
        >
        <span class="use">{{ style.description }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.specimens {
  margin-top: var(--ws-space-16);
  border-top: var(--ws-border-width-thin) solid var(--ws-color-border);
}

.specimen {
  padding-block: var(--ws-space-16);
  border-bottom: var(--ws-border-width-thin) solid var(--ws-color-border);
}

.specimen .sample {
  margin: 0;
  overflow-wrap: anywhere;
}

.sample.upper {
  text-transform: uppercase;
}

.specimen .meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--ws-space-4) var(--ws-space-16);
  margin: var(--ws-space-8) 0 0;
  color: var(--ws-color-text-secondary);
  font: var(--ws-text-caption);
}

.use {
  font-family: var(--ws-font-family-sans);
}
</style>
