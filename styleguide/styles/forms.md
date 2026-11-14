# Forms

The system draws no fields and no buttons of its own: an app draws them from the color roles, and the system gives it what they share. One height for every control, the sizes of the small boxes, a hover and a pressed fill for the primary button, a check icon, a segmented control, a list of terms and values, and code blocks that wrap.

This is a checkout built from them. Its fields, checkbox, steps and buttons are the page's own, in a dozen rules each:

<ExampleFrame src="/examples/form.html" title="A form on the system, at 1200 px" :width="1200" :height="980" />

And as a phone shows it:

<ExampleFrame src="/examples/form.html" title="A form on the system, at the width of this column" :height="1240" />

How to use each piece, and the rules they follow, are in [the usage guide](/docs/usage#forms).

## Sizes

| Token               | Size  | For                                                |
| ------------------- | ----- | -------------------------------------------------- |
| `--ws-size-control` | 40 px | A one-line field, a button and a segmented control |
| `--ws-size-check`   | 20 px | A checkbox or a radio button                       |
| `--ws-size-step`    | 24 px | The number of a step, in its circle                |
| `--ws-size-icon`    | 16 px | An icon next to a line of text, such as the check  |

## The primary button

Filled with `--ws-color-interactive`, its label in `--ws-color-on-interactive`. Under the pointer it takes `--ws-color-interactive-hover`, and while it is pressed `--ws-color-interactive-active`: the same color a step further from the page, so the label keeps its contrast and gains some.

```css
.button--primary:hover {
  border-color: var(--ws-color-interactive-hover);
  background: var(--ws-color-interactive-hover);
}
```

## Check

`--ws-icon-check` is drawn like the other icons: a mask, so it takes the color of what it stands on. A done step and a ticked box use it.

```css
.done::before {
  width: var(--ws-size-icon);
  height: var(--ws-size-icon);
  background: currentcolor;
  content: '';
  mask: var(--ws-icon-check) center / contain no-repeat;
}
```

## Segmented control

Buttons in a row that share their edges, one of them pressed: the switch between the languages of a page. The pressed one is raised, in the text color, with an edge of the interactive color twice as thick as the others.

```html
<div class="ws-segmented" role="group" aria-label="Language">
  <button type="button" aria-pressed="true" lang="en">English</button>
  <button type="button" aria-pressed="false" lang="sr">Srpski</button>
</div>
```

## Terms and values

A row each: a term in the voice of a label, its value in the face of a field. The answers of a form on its review step:

```html
<dl class="ws-pairs">
  <div>
    <dt>Name</dt>
    <dd>Milica Đorđević</dd>
  </div>
  <div>
    <dt>Email</dt>
    <dd>milica.djordjevic@example.com</dd>
  </div>
</dl>
```

And with `ws-pairs--amounts`, what an order costs: each amount at the right edge, in figures of one width so the digits line up, and the total in its own row.

```html
<dl class="ws-pairs ws-pairs--amounts">
  <div>
    <dt>Lunch</dt>
    <dd>€12.50</dd>
  </div>
  <div>
    <dt>Booking fee</dt>
    <dd>€1.00</dd>
  </div>
  <div class="ws-pairs__total">
    <dt>Total</dt>
    <dd>€109.50</dd>
  </div>
</dl>
```

## Number fields

A number field has no spin buttons: the page defaults hide the browser's own, and the arrow keys still step it.

## Code that wraps

A code block scrolls sideways. One that shows what a person typed, which can be a line of 500 characters, takes `ws-code--wrap` and wraps its lines instead. With the hanging indent of each line, the rest of a wrapped line starts one level in from its own text, so the shape of the code still reads. The `hangingIndent` transformer of the code theme gives Shiki's lines theirs.

```html
<figure class="ws-code ws-code--wrap">
  <figcaption><span>order.json</span><span>json</span></figcaption>
  <pre><code><span class="line" style="--ws-code-hang: 4">  "note": "..."</span></code></pre>
</figure>
```
