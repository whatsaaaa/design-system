# Color

Rosé Pine, mapped to roles. The main variant is the dark theme and the default. Dawn is the light theme.

Use the roles. They change with the theme and they carry the contrast rules. The palette under them is there to show where a role comes from.

## Roles

A role says what a color is for. Its value differs by theme, and not always in the obvious way: secondary text is `subtle` on dark, but on light it is the text color itself, because nothing lighter passes there.

<RoleTable group="roles" />

Love is the brand accent and the color of an error. So the things you press are not love: links, the focus ring, checked controls and the primary button take the interactive color, foam on dark and pine on light. A love button next to a love error would read as a warning.

## Themes

Dark is the default. Light applies when the system asks for it. `data-theme="dark"` or `data-theme="light"` on `<html>` overrides the system, and the [theme module](/docs/usage#_3-theme) remembers that choice.

A `dark` or `light` class does the same, as Nuxt UI and VueUse's `useColorMode` set it, so an app built on them needs no bridge. Where both are on one element, `data-theme` wins. A library that marks light only by leaving `dark` off, such as the toggle script in Tailwind's docs or VueUse's `useDark`, has to set a `light` class too: with no class the system decides.

The attribute and the class also work on any element, for a part of a page that has to stay in one theme:

```html
<div data-theme="dark">always dark, on a light page too</div>
<div class="light">always light, on a dark page too</div>
```

An element for one theme only, such as a cut of the logo, takes `ws-theme-dark` or `ws-theme-light`. Both are in the page and the one of the theme in effect where it stands shows, with no script. Switch the theme with <kbd>t</kbd> and the logo below changes. How to use them is in [the usage guide](/docs/usage#_3-theme).

<p>
  <img class="ws-theme-dark" src="/kit/whatsaaaa/lockup-dark.svg" alt="whatsaaaa, the cut for the dark theme" width="172" height="32" />
  <img class="ws-theme-light" src="/kit/whatsaaaa/lockup-light.svg" alt="whatsaaaa, the cut for the light theme" width="172" height="32" />
</p>

```html
<img class="ws-theme-dark" src="lockup-dark.svg" alt="whatsaaaa" />
<img class="ws-theme-light" src="lockup-light.svg" alt="whatsaaaa" />
```

The browser's own bars, such as a phone's address bar, take the page background of the theme shown, from the [theme module](/docs/usage#_3-theme).

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
