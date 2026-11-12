// Prints the contrast of every pair in tokens/contrast.json. The same numbers are tested in tests/contrast.test.ts.
import { measureAll } from './lib/contrast.ts'

for (const { theme, foreground, background, ratio, min, passes, below } of measureAll()) {
  const verdict = passes ? 'ok' : below?.[theme] ? 'below, accepted' : 'FAILS'
  console.log(
    `${theme.padEnd(5)} ${ratio.toFixed(2).padStart(5)} (min ${min}) ${verdict.padEnd(15)} ${foreground} on ${background}`,
  )
}
