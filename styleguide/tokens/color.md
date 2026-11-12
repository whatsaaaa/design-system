# Color

Rosé Pine, mapped to roles. The main variant is the dark theme and the default. Dawn is the light theme.

Use the roles. They change with the theme and they carry the contrast rules. The palette under them is there to show where a role comes from.

## Roles

A role says what a color is for. Its value differs by theme, and not always in the obvious way: secondary text is `subtle` on dark, but on light it is the text color itself, because nothing lighter passes there.

<RoleTable group="roles" />

Love is the brand accent and the color of an error. So the things you press are not love: links, the focus ring, checked controls and the primary button take the interactive color, foam on dark and pine on light. A love button next to a love error would read as a warning.

## Themes

Dark is the default. Light applies when the system asks for it. `data-theme="dark"` or `data-theme="light"` on `<html>` overrides the system, and the [theme module](/docs/usage#theme) remembers that choice.

The attribute also works on any element, for a part of a page that has to stay in one theme:

```html
<div data-theme="dark">always dark, on a light page too</div>
```

## Colors that do not change

The mark on its tile and code blocks look the same in both themes.

<RoleTable group="fixed" prefix="mark." />

Code blocks stay on the dark palette: on Dawn no syntax color except pine reaches AA on the surface.

<RoleTable group="fixed" prefix="code." />

<RoleTable group="fixed" prefix="syntax." />

## Contrast

These are the pairs the system relies on, measured from the tokens as WCAG 2 contrast and rounded down. Text has to reach 4.5, large type, outlines and graphics 3. The same list is a test: a change to a token that drops a pair below its bar fails the build.

<ContrastTable />

What follows from it:

- **Faint text is never body text.** It is for tab numbers, idle indicators and disabled things.
- **On light, a status is never a colored word.** Labels and icons take the text color, and the hue stays on the bar and the tint.
- **A status is never color alone.** A callout has a label and an icon, a state dot has its word next to it.
- **No placeholders in fields.** On Dawn nothing lighter than the text color passes. A hint goes under the field.

## Palette

The official values of Rosé Pine, from `@rose-pine/palette`. Rosé Pine is MIT licensed, and its copyright line travels with the token files.

### Main

<Swatches variant="main" />

### Dawn

<Swatches variant="dawn" />
