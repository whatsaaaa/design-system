# Project sprites

Every project has a sprite of its own from the same game as the ghost. The ghost itself stays with the handle.

## The rule

A project sprite is:

- on the same dark rounded tile as the ghost,
- one shape in the text color, on the 16 x 16 grid, with no outline and no shading,
- with exactly one love element, hanging at the bottom, the way the ghost carries its tongue,
- readable at 16 px.

The generator checks the first three. The last one is yours: look at the 16 px mark below before you keep a sprite.

## form-builder

Three bars of a form, and a button.

<MarkSizes identity="form-builder" />

<Kit identity="form-builder" match="^(mark|lockup)" />

## dotfiles

A tilde for the home folder, and a dot.

<MarkSizes identity="dotfiles" />

<Kit identity="dotfiles" match="^(mark|lockup)" />

## building-blocks

Two blocks, and a third one under them.

<MarkSizes identity="building-blocks" />

<Kit identity="building-blocks" match="^(mark|lockup)" />

## Adding a project

A project is one file in `identity/projects/`. Its name, a line about it, and sixteen rows of sixteen cells: `B` for the shape, `T` for the love element, `.` for nothing.

```json [identity/projects/form-builder.json]
{
  "name": "form-builder",
  "tagline": "forms from JSON, validated by Formisch",
  "banner": { "command": "form-builder --help" },
  "sprite": [
    "................",
    "................",
    "................",
    "..BBBBBBBBBBBB..",
    "..BBBBBBBBBBBB..",
    "................",
    "..BBBBBBB.BBBB..",
    "..BBBBBBB.BBBB..",
    "................",
    "..TTTTT.........",
    "..TTTTT.........",
    "..TTTTT.........",
    "...TTT..........",
    "................",
    "................",
    "................"
  ]
}
```

Then generate. The same script writes the whole kit of every identity: marks, lockups, favicons, the README header and the social card.

```sh
pnpm assets
```

To make the kit of a project that does not live in this repository, point the script at a file of the same shape and say where the files go:

```sh
pnpm assets --project ./my-project.json --out ./brand
```

`banner.command` is the command whose output the name is. Leave it out and the banner reads the README: `cat README.md`.
