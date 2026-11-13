# Licenses of what the system builds on

| What | License | Where it is used | File |
| --- | --- | --- | --- |
| Rosé Pine palette, from `@rose-pine/palette` | MIT, Copyright (c) mvllow | The color values in `tokens/palette.tokens.json` and everything built from them | `rose-pine-palette.LICENSE` |
| JetBrains Mono | SIL Open Font License 1.1 | The mono face. The font files are copied from `@fontsource-variable/jetbrains-mono` into `dist/fonts/` at build time, with the license next to them. Text in the generated artwork is outlined from `@fontsource/jetbrains-mono` | `dist/fonts/jetbrains-mono.OFL.txt`, written by the build |
| Inter | SIL Open Font License 1.1 | The sans face. The font files are copied from `@fontsource-variable/inter` into `dist/fonts/` at build time, with the license next to them | `dist/fonts/inter.OFL.txt`, written by the build |
| Departure Mono | SIL Open Font License 1.1, Copyright 2022-2024 Helena Zhang | Pixel outlines of six glyphs, in `src/ghost/glyphs.ts`, for the speech bubble of the ghost | `departure-mono.OFL.txt` |

No font file is kept in this repository.
