# Prose

Long-form text: headings, paragraphs, lists, inline code, code blocks, tables and callouts. This page is written in Markdown and is its own specimen.

Outside VitePress, put rendered Markdown in a container with the class `ws-prose`. The same rules style it.

## Headings

A page has one title. Sections start with a rule and a hash, like a comment that opens a block. In this theme the hash is the permalink of the section.

### A subsection

Subsections have no rule. They sit closer to their text.

#### A minor heading

The smallest heading is the size of the text, in the mono face.

## Text

The paragraph under the page title is the lead and is set a little larger. Everything after it is body text: 16 px Inter with a line height of 1.75.

Emphasis is **semibold**, not a color. _Italic_ is for titles and terms. A [link](/tokens/color) takes the interactive color and keeps its underline, so it does not depend on color alone. Inline code such as `hideAndClear` sits on a raised chip in the text color, and a key is drawn as a key: <kbd>t</kbd>.

> A quotation is set off by a rule on the left and takes the secondary text color.

---

A horizontal rule separates two parts of a page that have no heading between them.

## Lists

- **Bullets are sprite pixels**: small squares in the brand color.
- A list item can run over several lines. It keeps its indent, and the next item follows after a little space.
  - A nested list sits closer.
  - It uses the same bullet.
- The last item.

1. Numbered lists use the mono face for their numbers.
2. The numbers line up on the right.
3. And so on.

## Code

A code block has a caption: the file name on the left when it has one, the language on the right. Code blocks stay dark in both themes.

```ts [conditions.ts]
import { affects } from '@whatsaaaa/form-builder-affects'
import { createSchemaBuilder } from '@whatsaaaa/form-builder-schema'

// the extension adds conditions to definitions
const builder = createSchemaBuilder({ extensions: [affects()] })
const schema = builder.build(definition)
```

```json
{
  "name": "grad",
  "type": "select",
  "required": true,
  "options": ["Beograd", "Novi Sad", "Niš", "Kragujevac"]
}
```

Lines can be highlighted, and a diff shows what changed:

```ts{2}
const people = [
  { name: 'Milica Jovanović', city: 'Novi Sad' },
  { name: 'Nikola Petrović', city: 'Niš' },
]
```

```ts
const required = false // [!code --]
const required = true // [!code ++]
```

Several blocks can share one frame:

::: code-group

```sh [pnpm]
pnpm add @whatsaaaa/design-system
```

```sh [npm]
npm install @whatsaaaa/design-system
```

:::

## Tables

A table scrolls inside its own frame, so a wide one never widens the page. Heads are small, uppercase and mono.

| Name              | City       | Joined | Role        |
| ----------------- | ---------- | ------ | ----------- |
| Milica Jovanović  | Novi Sad   | 2021   | Maintainer  |
| Nikola Petrović   | Niš        | 2022   | Contributor |
| Jelena Đorđević   | Beograd    | 2024   | Contributor |
| Stefan Šćepanović | Kragujevac | 2025   | Reviewer    |

## Callouts

A callout has a bar in the status color, a label and an icon. The status is never carried by color alone. On the light theme the label and icon take the text color and the hue stays on the bar.

::: tip
Use `hideAndClear` for data that only makes sense while the field shows.
:::

::: info
A note is for something worth knowing that is not a warning.
:::

::: warning
Without the extension, `affects` is an unknown key and `build()` throws.
:::

::: danger
This removes the form and every answer it has collected.
:::

::: details Why code blocks stay dark
On Dawn the syntax colors are too pale for text: love is 4.03:1 on the surface, iris 3.64, foam 3.29. On the dark palette all of them pass.
:::

## Outside VitePress

The same styles work on plain HTML, with the classes of the system. This is a page that uses nothing but the built stylesheet:

<ExampleFrame src="/examples/prose.html" title="Prose, a code block and a callout on a plain page" :height="620" />

```html
<article class="ws-prose">
  <h1>Conditions</h1>
  <p>The affects package adds conditions to definitions.</p>

  <figure class="ws-code">
    <figcaption><span>conditions.ts</span><span>ts</span></figcaption>
    <pre><code>...</code></pre>
  </figure>

  <aside class="ws-callout ws-callout--warning">
    <p class="ws-callout__title">Warning</p>
    <p>Without the extension, affects is an unknown key.</p>
  </aside>

  <div class="ws-table">
    <table>
      ...
    </table>
  </div>
</article>
```

| Class                                                 | What it is                                         |
| ----------------------------------------------------- | -------------------------------------------------- |
| `ws-prose`                                            | The container for long-form text                   |
| `ws-lead`                                             | A lead paragraph that is not right under the title |
| `ws-crumb`                                            | The path above a page title                        |
| `ws-code`                                             | A code block with a caption                        |
| `ws-callout`, with `--tip`, `--warning` or `--danger` | A callout. Without a modifier it is a note         |
| `ws-table`                                            | The frame a table scrolls in                       |
