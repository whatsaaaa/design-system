# Banners and icons

The banner is a terminal window: a command, and the name as its output. A project changes one command, one name and one sprite.

## README header

1280 x 320, for the top of a README. The SVG has its text as paths, so it needs no font where it is shown.

<Kit identity="whatsaaaa" match="^readme-header\.svg" wide />
<Kit identity="form-builder" match="^readme-header\.svg" wide />
<Kit identity="dotfiles" match="^readme-header\.svg" wide />
<Kit identity="building-blocks" match="^readme-header\.svg" wide />

```md
<img src="./assets/readme-header.svg" alt="form-builder" width="100%" />
```

Each header also comes as a PNG at twice its size, `readme-header.png`, for places that do not take SVG.

## Social card

1280 x 640, the size link previews ask for. Use the PNG: most previews do not take SVG.

<Kit identity="whatsaaaa" match="^social-card\.png" wide />
<Kit identity="form-builder" match="^social-card\.png" wide />

The cards of dotfiles and building-blocks are in the kit too.

## Favicons

The favicon is the mark on its tile, drawn for each size on whole pixels.

<Kit identity="whatsaaaa" match="^(favicon|apple-touch-icon|icon-)" />

```html
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

`icon-192.png` and `icon-512.png` are for a web app manifest. The touch icon is square, because iOS rounds it itself.

Every project has the same set. Take it from `assets/<project>/`.
