// The asset kit as the style guide lists it, from the manifest the generator writes.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export interface KitEntry {
  file: string
  width: number
  height: number
  use: string
}

export type KitData = Record<string, KitEntry[]>

declare const data: KitData
export { data }

export default {
  watch: ['../../../assets/manifest.json'],
  load(): KitData {
    const manifest = join(resolve(import.meta.dirname, '../../..'), 'assets/manifest.json')
    return JSON.parse(readFileSync(manifest, 'utf8')).identities
  },
}
