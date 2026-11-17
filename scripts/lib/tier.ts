// The component tier: tokens/components/, one file per group, named for its group. The token build
// emits the groups on the theme selectors and leaves them out of Tailwind's theme, and the contrast
// check pairs their colors by name, all from this list, so a new file is the whole of a new group.
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

export const tierDirectory = resolve(import.meta.dirname, '../../tokens/components')

/** The files of the tier, by name, in order. */
export const tierFiles = readdirSync(tierDirectory)
  .filter((file) => file.endsWith('.tokens.json'))
  .sort()

/** The groups of the tier, each the name of its file. */
export const tierGroups = tierFiles.map((file) => file.slice(0, -'.tokens.json'.length))

/** Whether a token id is in the tier. */
export const inTier = (id: string): boolean =>
  tierGroups.some((group) => id.startsWith(`${group}.`))
