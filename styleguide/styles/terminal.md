# Terminal frame

A page as a terminal session: a tab bar on top, prompts as headings, a status line at the bottom. The pieces are plain CSS classes with no framework behind them, so any app or site can carry them.

This is a page built from nothing but the system's stylesheet and its three small modules. It is the handle's home page, laid out at 1200 px and scaled to fit:

<ExampleFrame src="/examples/terminal.html" title="The terminal frame, at 1200 px" :width="1200" :height="700" />

And the same page as a phone shows it:

<ExampleFrame src="/examples/terminal.html" title="The terminal frame, at the width of this column" :height="640" />

## The window

`ws-term` is the window: a border, rounded corners, and three rows for the bar, the content and the bar. Give it a height and the content scrolls inside it. Leave it out and use the bars on a page that scrolls, as this guide does.

```html
<div class="ws-term">
  <header class="ws-tab-bar">...</header>
  <main>...</main>
  <footer class="ws-status-line">...</footer>
</div>
```

## Tab bar

The brand, the tabs, and whatever goes at the right end. Tabs number themselves, like the windows of a terminal multiplexer, while the number keys go to them. The current tab is the link with `aria-current`. The tabs are optional: the bar of a site of one page is the brand and the end. The usage guide says when the numbers show, with the rest of the rules: see [classes](/docs/usage#_6-classes) and [keys](/docs/usage#_7-keys).

```html
<header class="ws-tab-bar">
  <a class="ws-tab-bar__brand" href="/">whatsaaaa</a>
  <nav class="ws-tabs" aria-label="Main">
    <ul>
      <li><a href="/" aria-current="page">home</a></li>
      <li><a href="/projects/">projects</a></li>
    </ul>
  </nav>
  <div class="ws-tab-bar__end">
    <a class="ws-arrow" href="https://github.com/whatsaaaa">github</a>
  </div>
</header>
```

Below 64rem the tabs take a row of their own and share it evenly.

## Prompts

A prompt is a chevron and a command. As a heading it names a section by the command whose output the section is: `whoami` for the introduction, `ls ~/projects` for the list of projects. A command too long for its line wraps, and the chevron stays on the first line.

```html
<h2 class="ws-prompt">ls ~/projects</h2>

<p class="ws-prompt">
  <a href="/projects/">cd ~/projects</a>
  <span class="ws-prompt__comment"># all projects</span>
</p>
```

`ws-output` sets what a command printed off with a rule on the left. `ws-cursor` is the block cursor after the handle. It does not blink.

## Status line

The mode, where you are, the keys, and one or two facts at the right edge.

```html
<footer class="ws-status-line">
  <span class="ws-status-line__mode">NORMAL</span>
  <span class="ws-status-line__path">
    <span class="ws-status-line__file"><span>~/whatsaaaa</span></span>
  </span>
  <span class="ws-status-line__keys">
    <a href="https://github.com/whatsaaaa" data-ws-key="g"><kbd class="ws-kbd">g</kbd>github</a>
    <button type="button" data-ws-key="t"><kbd class="ws-kbd">t</kbd>theme</button>
  </span>
  <button
    type="button"
    class="ws-status-line__switch"
    role="switch"
    aria-label="Shortcut keys"
    data-ws-keys-switch
  >
    keys
    <span class="ws-status-line__on" aria-hidden="true">on</span>
    <span class="ws-status-line__off" aria-hidden="true">off</span>
  </button>
  <button type="button" class="ws-status-line__theme">
    <span class="ws-visually-hidden">Switch theme, now</span>
    <span class="ws-theme-dark">rose-pine</span>
    <span class="ws-theme-light">rose-pine-dawn</span>
  </button>
</footer>
```

The mode reads `NORMAL`, or `INSERT` while you type in a field. The path takes the room the others leave and gives way to them: it is cut with an ellipsis, and where not even its first character fits, it goes as a whole. The last item is the name of the theme, and a button that switches it, at every width. It holds both names and shows the one of the theme. The rules for each are in [the usage guide](/docs/usage#status-line).

A focus ring in the bars is drawn inside its control, so the bars and the corners of the window do not cut it off.

### Keys

The key hints are declared on the controls they press, with `data-ws-key`, and the button that reads `keys on` is the switch that turns them off, with `data-ws-keys-switch`. The shortcuts module makes both work. How to wire them into a page, and the rules they follow, are in [the usage guide](/docs/usage#_7-keys).

## Small pieces

| Class                                           | What it is                                        |
| ----------------------------------------------- | ------------------------------------------------- |
| `ws-kbd`                                        | A key cap                                         |
| `ws-tag`                                        | A tag on a tint of the interactive color          |
| `ws-tag`, with `--outline`                      | An outlined tag, for a plain list such as a stack |
| `ws-state`, with `--active` or `--experimental` | A state as a dot with its word                    |
| `ws-arrow`                                      | An arrow after a link that leaves the site        |
| `ws-cursor`                                     | The block cursor                                  |
| `ws-visually-hidden`                            | Text only assistive technology reads              |

## In the docs theme

The docs theme draws VitePress's own nav bar as the tab bar and adds the status line, with <kbd>/</kbd>, <kbd>j</kbd>, <kbd>k</kbd> and <kbd>t</kbd> as its keys and the switch that turns them off. See [Using the theme](/docs/).
