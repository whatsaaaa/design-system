import type { Theme } from 'vitepress'
import DocsTheme from '../../../src/vitepress/index.ts'
import ContrastTable from './components/ContrastTable.vue'
import ExampleFrame from './components/ExampleFrame.vue'
import GhostDemo from './components/GhostDemo.vue'
import Kit from './components/Kit.vue'
import MarkSizes from './components/MarkSizes.vue'
import Poses from './components/Poses.vue'
import RoleTable from './components/RoleTable.vue'
import Scale from './components/Scale.vue'
import Swatches from './components/Swatches.vue'
import TypeSpecimens from './components/TypeSpecimens.vue'

// The style guide is a docs site on the docs theme. Its own components only show the system.
export default {
  extends: DocsTheme,
  enhanceApp({ app }) {
    for (const [name, component] of Object.entries({
      ContrastTable,
      ExampleFrame,
      GhostDemo,
      Kit,
      MarkSizes,
      Poses,
      RoleTable,
      Scale,
      Swatches,
      TypeSpecimens,
    }))
      app.component(name, component)
  },
} satisfies Theme
