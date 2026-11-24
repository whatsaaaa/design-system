# Versioning

What `@whatsaaaa/design-system` promises from one version to the next: what counts as its public surface, and whether a change to it is a major, a minor or a patch. A change is classified by this page, the same way every time.

The package follows [Semantic Versioning](https://semver.org). The promise starts with 1.0.0: from then on the public surface holds until the next major.

**Before 1.0.0** nothing was promised. A minor of 0.x could break anything on this page, and its changelog says what. A patch of 0.x did not break. A caret range on 0.x, such as `^0.14.0`, held a project on that minor for this reason, so each minor was a bump made by hand. Everything below is the rule from 1.0.0 on.

## The public surface

What a project can rely on:

| Part                 | What is promised                                                                                                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The entries          | Every path of the `exports` map in `package.json`. Under a pattern, each file it reaches: the stylesheets of `css/*.css`, the token and spec files, the fonts, and the files of each kit under `assets/`, which `assets/manifest.json` lists                                                         |
| The modules          | What each module entry exports, with its types: `tokens`, `ghost`, `theme`, `theme/meta`, `shortcuts`, `shiki`, `stylelint`, `testing`, `vitepress` and `vitepress/config`. The two head scripts, `theme/init.js` and `shortcuts/init.js`, and the storage keys they read                            |
| CSS variables        | The name of every `--ws-*` variable the stylesheets declare, those of the component tier among them, and what each one means: `--ws-color-danger` stays the color of an error                                                                                                                        |
| Classes and markup   | Every `ws-` class and its modifiers, the markup documented for it in [usage.md](./usage.md) and in the comment above its rules, the `<ws-ghost>` element and its attributes, and the attributes the styles and modules read: `data-theme`, the `dark` and `light` classes and the `data-ws-*` family |
| Tailwind             | The utility names the Tailwind entry gives the tokens, such as `bg-surface` and `text-h1`, the breakpoints, the four layers and their order, and the `dark:` and `light:` variants                                                                                                                   |
| Token data           | The id of every token, such as `color.bg`, its type, and the inputs of the resolver: the `theme` modifier with `dark` and `light`                                                                                                                                                                    |
| Component specs      | The spec format, `specs/spec.schema.json`, and of every stable spec its name, its parts, kinds, sizes and states, and its gallery ids. See [drafts](#draft-and-stable)                                                                                                                               |
| The testing helper   | The API of `@whatsaaaa/design-system/testing`: `expectSpec`, `checkSpec`, `specNames` and `loadSpec`, their options and what they return, and the gallery contract they read: `data-spec`, `data-slot` and `data-demo`                                                                               |
| The lint rules       | The default export of `@whatsaaaa/design-system/stylelint`: a config that a project extends                                                                                                                                                                                                          |
| Node and peer ranges | `engines.node` and each range of `peerDependencies` in `package.json`, and which peers are optional                                                                                                                                                                                                  |

Not part of it:

- **Anything no entry of the `exports` map reaches.** The layout of `dist/` and of `src/` can change in any release: import a path of the map, never a file by its place in `node_modules`.
- **A class, a variable or a module export that no document names**, and the selectors a stylesheet uses inside a documented piece.
- **The value behind a name.** A color, a size or the look of a class can change in a minor, as below. What holds is the name and what it is for.
- **A draft spec**, and a tier token only draft specs read. See [drafts](#draft-and-stable).
- **What an implementation records about itself**: the library it is built on, its map of the slot that draws each part, its props, its deviations and the result of its parity test. A spec holds none of it: it is kept in the implementation's own repository, belongs to it and changes when it does. How the helper takes a part map, its `parts` option and what a map can name, is its API and is promised. What one implementation's map says is not.
- **The style guide, the repository's scripts and tests, and the generated text of a comment.**

## Major, minor, patch

### Major

- Removing or renaming anything of the public surface: an entry, a module's export, a variable, a class or a piece of its documented markup, an attribute, a utility name, a token id, a file of the asset kit.
- Changing what a name means: a role that now stands for something else, a class that now draws another piece.
- Changing the markup a class needs, so that markup written as documented no longer draws as documented.
- In a stable spec: removing or renaming a part, a kind, a size, a state or a gallery id, or any other change an implementation can follow only by changing what its own users write.
- In the spec format: a new required field, a removed field, or a field that now means something else.
- A stable spec that goes back to draft.
- Changing the testing helper's API so that a test written against it no longer runs.
- Narrowing the Node range or a peer range, so that a version it took is no longer taken, or making an optional peer required.

### Minor

- Anything added: an entry, an export, a token, a group of the component tier, a class or a modifier, a utility, an asset, an optional field of the spec format, an option of the helper.
- A new spec, which enters as a draft, and a draft that turns stable.
- In a stable spec, an addition: a part, a kind, a size, a state, a row of its state table, a gallery id. A new gallery id is a new example every gallery has to show.
- Widening a closed list of the spec format: a size next to the five, a state or a CSS property next to those the schema lists. A reader of the specs takes a value it does not know as an addition, not as an error.
- A value that changes on purpose: a color, a size, a text style, the look of a class, or a row of a stable spec that now names a token or a value that computes to something else. The pull request shows the screenshots.
- A rule added to the lint config, or one made stricter.
- A deprecation, and a renamed token of the component tier with its alias, both [below](#deprecation-and-renames).
- Widening the Node range or a peer range.

### Patch

- A fix that brings the output back to what the documents and the specs already say.
- A row of a spec whose token is replaced by another of the same value in both themes. Nothing an implementation draws changes, so a group of the component tier can take over a row that named a role.
- A fix to the testing helper that makes it find a difference from a spec it should have found.
- A change to a document or a comment.

### What an implementation sees

An implementation that holds its gallery to the specs runs its parity test on every update of this package. After a minor, or a patch that fixes the helper, that test can fail: a stable spec gained an example, a row now computes to another value, or the helper finds what it missed. That is the test at work, in the pull request that brings the update, before a user sees a difference. A major is what the implementation cannot follow without a major, or a break, of its own.

## Draft and stable

Every spec says in its `status` whether it is a `draft` or `stable`.

- **A draft is outside the promise.** It can change in any release, in any way, and so can a token of the component tier that only draft specs read. So a new component enters in a minor without risk to what is already promised: its spec as a draft, with the tier tokens it needs.
- **A spec turns stable in a minor, once an implementation passes it**: the implementation's gallery shows every example of the spec's gallery contract, and the testing helper passes it for the whole spec. From that release on the spec is held to the rules above.
- **A tier token is promised from the release in which a stable spec reads it.** A token that a stable spec and a draft both read is promised.

Each spec's page in the style guide, and the `status` in its file, say which it is in the version installed. A spec carries no version of its own: the changelog of a release says which specs it changed.

## Deprecation and renames

Nothing public is removed without notice.

- **Deprecation before removal.** What will be removed is first deprecated in a minor: a token with `$deprecated` in the token data, anything else with a notice in [usage.md](./usage.md) and in the changelog, each naming what to use instead. It keeps working, unchanged, until the next major, which removes it. A major removes only what a released minor has already deprecated.
- **A renamed token of the component tier keeps its old variable.** The rename is a minor: the token takes its new id and its new variable, and the old variable stays as an alias of the new one, deprecated, so a stylesheet that reads it draws as before. The old variable stays for at least two minors, and its removal waits for the next major after them. The old id does not stay in the token data, where a tree cannot hold both a token and a group of one name: `field.bg` cannot stand next to `field.bg.rest`. So a stable spec that named the old id names the new one in the same release, which by the rule above is a patch to that spec: the value is the same.

## Depending on the package

- From 1.0.0, depend on it with a caret range, `^1.0.0`. Every minor and patch then arrives as an ordinary update, and none of them breaks what this page promises.
- Read the changelog of a minor for its deprecations, and for the drafts it changed if the project reads one.
- A project that reads a draft spec, or a tier token only drafts read, takes its changes as they come. An implementation that builds against a draft is how the draft turns stable.

## Classifying a change

A pull request that changes what the package ships adds a changeset, and its bump is the highest this page gives any part of the change.
