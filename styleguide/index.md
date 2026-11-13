# Whatsaaaa design system

One identity, one set of tokens and one voice for every Whatsaaaa project: the personal site, the docs sites, the apps and the READMEs.

![The README header of the handle: a terminal window in which whoami prints whatsaaaa, with the ghost beside it](/kit/whatsaaaa/readme-header.svg)

## The direction

The handle is a long, drawn-out shout. The identity keeps that: a small ghost with its tongue out, and a name whose held a's are set in the accent color.

Everything else is a terminal. Pages have a tab bar on top and a status line at the bottom, sections are named by the command whose output they are, and the voice is a mono face. Long text is set in a sans face, because a document should read like a document.

Colors are Rosé Pine: the main variant for dark, which is the default, and Dawn for light.

## What is in it

| Part                    | What it is                                                                                                              | Where to look                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Identity                | The ghost in every cut, the wordmark, six poses, the sprites of the projects, favicons, README headers and social cards | [The ghost](/identity/), [Project sprites](/identity/projects), [Banners and icons](/identity/banners) |
| Tokens                  | Color roles for both themes, type, space, radii and motion, as CSS variables and as data                                | [Color](/tokens/color), [Typography](/tokens/typography), [Space, radius and motion](/tokens/space)    |
| Styles                  | Prose, code blocks, tables, lists and callouts, and the terminal frame                                                  | [Prose](/styles/prose), [Terminal frame](/styles/terminal)                                             |
| The ghost as an element | `<ws-ghost>`, with the easter egg                                                                                       | [The ghost](/identity/#the-easter-egg)                                                                 |
| Docs theme              | A VitePress theme. This guide runs on it                                                                                | [Using the theme](/docs/), [a sample page](/docs/sample/conditions)                                    |

## Using it

A project takes the tokens and styles from the package, and its artwork from the asset kit. The [usage guide](/docs/usage) says how, in the order a coding agent needs it.

::: warning Not deployed
The package is on npm, but this guide is not deployed yet.
:::

## Keys

The hints in the status line are real. Press <kbd>t</kbd> to switch the theme, <kbd>j</kbd> and <kbd>k</kbd> to scroll, <kbd>/</kbd> to search, and a number to go to a tab. The status line shows `INSERT` while you type in a field, where single keys are just letters.

The switch next to the hints, `keys on`, turns every key off, and the browser remembers it. The buttons stay and work by hand, and nothing names a key any more.
