# Typography

Two families. JetBrains Mono is the voice: headings, labels, navigation and code. Inter is for long-form text and for what people type into fields. Both are variable fonts, self-hosted, under the SIL Open Font License.

## Text styles

A text style is a token: one variable for the `font` shorthand and one per property. Set both lines and the style is complete.

```css
h1 {
  font: var(--ws-text-h1);
  letter-spacing: var(--ws-text-h1-letter-spacing);
}
```

<TypeSpecimens />

The compact styles are for narrow screens, below 64rem. The tagline is the line under the display name, next to the ghost. The overline is set in uppercase.

## Serbian Latin

Both families ship with the `latin-ext` subset, which has č, ć, š, ž and đ. A browser downloads that file only on a page that uses them.

<div class="serbian">
  <p class="mono-800">Čačak Ćuprija Šabac Žabalj Đerdap</p>
  <p class="mono-400">Ljubazni fenjerdžija čađavog lica hoće da mi pokaže štos.</p>
  <p class="mono-italic">čćšžđ ČĆŠŽĐ lj nj dž</p>
  <p class="sans-600">Čačak Ćuprija Šabac Žabalj Đerdap</p>
  <p class="sans-400">Ljubazni fenjerdžija čađavog lica hoće da mi pokaže štos. Milica Đorđević i Nikola Živković žive u Nišu, a Jelena Šćepanović u Novom Sadu.</p>
  <p class="sans-italic">čćšžđ ČĆŠŽĐ lj nj dž</p>
</div>

To ship Serbian Cyrillic as well, add `cyrillic` to the subsets in `scripts/lib/fonts.ts`. Both packages have it.

## Weights

| Weight | Token                        | Used for                                             |
| ------ | ---------------------------- | ---------------------------------------------------- |
| 400    | `--ws-font-weight-regular`   | Text, labels                                         |
| 500    | `--ws-font-weight-medium`    | State words                                          |
| 600    | `--ws-font-weight-semibold`  | Emphasis in long-form text                           |
| 700    | `--ws-font-weight-bold`      | Section headings, group headings                     |
| 800    | `--ws-font-weight-extrabold` | The page title, the handle, the brand in the tab bar |

## Sizes

Named by the size in px at the default root size. Prefer a text style over a size: the style has the line height and tracking that go with it.

<Scale kind="fontSizes" />

## Rules

- **Mono speaks, sans explains.** A heading, a label, a tab or a key is mono. A paragraph is sans.
- **Code is never set with ligatures.** `=>` stays two characters.
- **About 90 characters a line** for long-form text: 16 px Inter in a column of 43rem.
- **Headings are tight, text is loose.** Tracking goes down as size goes up, line height the other way.

<style scoped>
.serbian {
  display: grid;
  gap: var(--ws-space-12);
  margin-top: var(--ws-space-16);
  padding: var(--ws-space-20) var(--ws-space-24);
  border: var(--ws-border-width-thin) solid var(--ws-color-border);
  border-radius: var(--ws-radius-lg);
}

.serbian p {
  margin: 0;
  line-height: var(--ws-font-line-height-normal);
}

.mono-800 {
  font: var(--ws-text-h2);
  font-weight: var(--ws-font-weight-extrabold);
}

.mono-400,
.mono-italic {
  font-family: var(--ws-font-family-mono);
  font-size: var(--ws-font-size-15);
}

.sans-600 {
  font-size: var(--ws-font-size-20);
  font-weight: var(--ws-font-weight-semibold);
}

.mono-italic,
.sans-italic {
  font-style: italic;
}
</style>
