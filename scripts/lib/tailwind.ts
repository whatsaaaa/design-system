// The Tailwind CSS entry, dist/tailwind.css: Tailwind and the stylesheets of index.css in cascade
// layers, the tokens as Tailwind's theme, in dist/tailwind/theme.css, and the dark: and light:
// variants, in dist/tailwind/variants.css. The token build writes the theme and the variants, so
// a token added to a group below comes through on its own, and a variant reads a theme the same
// way the tokens do. The CSS build writes the entry from the imports of index.css, so a
// stylesheet added there comes through too.
import { type Theme, inEffect, systemIs, unchosen } from './theme-selectors.ts'

/** A token as the CSS plugin writes it: its id, its variable, and its value or its parts. */
export interface CssToken {
  id: string
  localID?: string
  value: string | Record<string, string>
}

/**
 * The groups that have no place in Tailwind's theme, and why. A token in a group that is neither
 * here nor mapped below fails the build, so a new group is a decision and never a silent gap.
 */
const leftOut: Record<string, string> = {
  palette: 'a palette color never colors interface',
  code: 'code blocks are dark in both themes and read their own variables',
  syntax: 'code blocks are dark in both themes and read their own variables',
  mark: 'the colors of the ghost are its own',
  'font.size': 'text takes a text style, not a size',
  'motion.duration': "Tailwind's duration-* takes milliseconds, and transitions take the fast one",
}

/** The Tailwind name of a font weight, where it differs from the token's. */
const weightNames: Record<string, string> = { regular: 'normal' }

/** The parts of a text style that Tailwind's --text-* keeps with the size. */
const textParts = ['line-height', 'letter-spacing', 'font-weight'] as const

/** Tailwind's own rounded-full stays: it is a static utility, not a theme value. */
const ownRadii = new Set(['full'])

export function tailwindTheme(tokens: CssToken[]): string {
  const byId = new Map(tokens.map((token) => [token.id, token]))
  const used = new Set<string>()
  const variable = (id: string) => {
    const token = byId.get(id)
    if (!token?.localID) throw new Error(`the Tailwind theme reads ${id}, which the build lacks`)
    used.add(id)
    return token.localID
  }
  const read = (id: string) => `var(${variable(id)})`
  /** Every token in a group, by the rest of its id, in the order the build hands them over. */
  const group = (prefix: string) =>
    tokens
      .filter((token) => token.id.startsWith(`${prefix}.`))
      .map((token) => ({ id: token.id, name: token.id.slice(prefix.length + 1) }))
  const declare = (prefix: string, key: (name: string) => string | undefined) =>
    group(prefix).flatMap(({ id, name }) => {
      const property = key(name)
      if (!property) {
        used.add(id)
        return []
      }
      return [`${property}: ${read(id)};`]
    })

  const text = group('text').flatMap(({ id, name }) => {
    const parts = byId.get(id)?.value
    if (typeof parts !== 'object') throw new Error(`${id} is not a text style`)
    const base = variable(id)
    return [
      `--text-${name}: var(${base}-font-size);`,
      ...textParts.map((part) => {
        if (!(part in parts)) throw new Error(`${id} has no ${part}`)
        return `--text-${name}--${part}: var(${base}-${part});`
      }),
    ]
  })

  // Every space is the pixels of its name in rem, so it is on Tailwind's scale of four pixels to
  // a step, with space.4 as the step: space.10 is 2.5 steps, p-2.5
  for (const { id, name } of group('space')) {
    const value = byId.get(id)?.value
    if (typeof value !== 'string' || !value.endsWith('rem') || parseFloat(value) * 16 !== +name)
      throw new Error(`${id} is ${String(value)}, which is not ${name}px in rem`)
    used.add(id)
  }

  const sections: [comment: string, declarations: string[]][] = [
    [
      `Colors are the roles and nothing else: Tailwind's palette is taken out, as the system
never colors interface with a palette color. The token --ws-color-<role> is the color
<role>: bg-surface, text-text-secondary, border-field-border, bg-danger-tint.`,
      ['--color-*: initial;', ...declare('color', (name) => `--color-${name}`)],
    ],
    [
      'The two families, and no others: font-mono and font-sans.',
      ['--font-*: initial;', ...declare('font.family', (name) => `--font-${name}`)],
    ],
    [
      `The text styles, as font sizes that bring their line height, letter spacing and weight:
text-h1, text-body-sm. A style's family does not come with it, so set it with font-mono or
font-sans, as the style says, and text-overline with uppercase. Tailwind's own sizes stay
for code that expects them.`,
      text,
    ],
    [
      "The line heights and weights under Tailwind's names: leading-normal, font-semibold.",
      [
        '--leading-*: initial;',
        ...declare('font.line-height', (name) => `--leading-${name}`),
        '--font-weight-*: initial;',
        ...declare('font.weight', (name) => `--font-weight-${weightNames[name] ?? name}`),
      ],
    ],
    [
      `Space: every --ws-space-<px> is on Tailwind's scale, four pixels to a step, so p-4 is
--ws-space-16 and gap-2.5 is --ws-space-10. The sizes are named steps of the same
scale, for any width, height, padding or gap: h-tab-bar, max-w-content.`,
      [`--spacing: ${read('space.4')};`, ...declare('size', (name) => `--spacing-${name}`)],
    ],
    [
      "The radii by their names: rounded-md is --ws-radius-md. rounded-full is Tailwind's own.",
      [
        '--radius-*: initial;',
        ...declare('radius', (name) => (ownRadii.has(name) ? undefined : `--radius-${name}`)),
      ],
    ],
    [
      `Borders, not shadows. The widths by their names, border-thin and border-b-medium,
next to Tailwind's border-2, and no shadow utilities.`,
      [
        ...declare('border-width', (name) => `--border-width-${name}`),
        '--shadow-*: initial;',
        '--inset-shadow-*: initial;',
        '--drop-shadow-*: initial;',
        '--text-shadow-*: initial;',
      ],
    ],
    [
      `Motion. ease-standard is most movement, and Tailwind's ease-in-out is it too.
Transitions take the fast duration. Movement still goes in motion-safe:, which is
prefers-reduced-motion: no-preference.`,
      [
        '--ease-*: initial;',
        ...declare('motion.easing', (name) => `--ease-${name}`),
        `--ease-in-out: ${read('motion.easing.standard')};`,
        `--default-transition-duration: ${read('motion.duration.fast')};`,
        `--default-transition-timing-function: ${read('motion.easing.standard')};`,
      ],
    ],
  ]

  const unmapped = tokens.filter(
    ({ id }) =>
      !used.has(id) && !Object.keys(leftOut).some((prefix) => id.startsWith(`${prefix}.`)),
  )
  if (unmapped.length > 0)
    throw new Error(
      `the Tailwind theme has no place for ${unmapped.map(({ id }) => id).join(', ')}: map the ` +
        'group in scripts/lib/tailwind.ts, or say there why it is left out',
    )

  const comment = (text: string, indent: string) =>
    text.includes('\n')
      ? `${indent}/*\n${text
          .split('\n')
          .map((line) => `${indent} * ${line}`)
          .join('\n')}\n${indent} */`
      : `${indent}/* ${text} */`
  const body = sections
    .map(
      ([text, declarations]) =>
        `${comment(text, '  ')}\n${declarations.map((line) => `  ${line}`).join('\n')}`,
    )
    .join('\n\n')
  const width = Math.max(...Object.keys(leftOut).map((prefix) => prefix.length))
  return `/*
 * The tokens as Tailwind's theme, for tailwind.css. Written by the token build from the tokens,
 * so every token of a group mapped here is here. Left out:
 *
${Object.entries(leftOut)
  .map(([prefix, why]) => ` *   ${prefix.padEnd(width)}  ${why}`)
  .join('\n')}
 *
 * Inline: a utility reads the token itself, where it is used. So bg-surface follows the theme
 * of the part of the page it is in, as the tokens do.
 */
@theme inline {
${body}

  /*
   * The one breakpoint is Tailwind's lg, 64rem: max-lg: is the system's compact width,
   * width < 64rem. The other breakpoints stay for code that expects them.
   */
}
`
}

/**
 * The dark: and light: variants, for the theme in effect where an element stands, as the tokens
 * read it: the nearest data-theme or dark or light class, on <html> or on an element around it,
 * or with neither the system's theme. They weigh nothing, as Tailwind's own dark: does.
 */
export function tailwindVariants(): string {
  const variant = (theme: Theme) => `@custom-variant ${theme} {
  &:where(
      ${inEffect(theme).join(',\n      ')}
    ) {
    @slot;
  }

  @media ${systemIs(theme)} {
    &:where(${unchosen}) {
      @slot;
    }
  }
}`
  return `/*
 * dark: and light: follow the theme as the tokens do. The theme of an element is the nearest
 * choice around it, made with data-theme="dark" or "light" or with a dark or light class, on
 * <html> or on any element around a part of the page. On one element data-theme wins over the
 * class, and both classes together choose nothing. With no choice around it the system decides:
 * dark, unless it asks for light.
 *
 * Written by the token build from the selectors the tokens use, scripts/lib/theme-selectors.ts.
 * Like the rules of ws-theme-dark and ws-theme-light, they follow a choice on <html> and three
 * parts held in a theme, one inside the other.
 *
 * tailwind.css brings them. A library that defines its own dark: or light: after it, as Nuxt UI
 * does, replaces them: import this file again after the library.
 */
${variant('dark')}

${variant('light')}
`
}

/** The layer of each stylesheet of index.css, by its name. The rest are components. */
const layers: Record<string, string | undefined> = {
  // @font-face rules, which no layer orders
  fonts: undefined,
  // custom properties on :root, next to Tailwind's
  tokens: 'theme',
  icons: 'theme',
  // the page defaults, over Tailwind's preflight
  base: 'base',
}

/**
 * The entry, from the imports of src/css/index.css: each as the file dist/ has of it, relative to
 * dist/tailwind.css.
 */
export function tailwindEntry(sheets: string[]): string {
  const imports = sheets.map((sheet) => {
    const name = sheet.replace(/^.*\//, '').replace(/\.css$/, '')
    const layer = name in layers ? layers[name] : 'components'
    return `@import '${sheet}'${layer ? ` layer(${layer})` : ''};`
  })
  return `/*
 * The design system for Tailwind CSS v4. Import it instead of tailwindcss, as the first import of
 * the app's stylesheet, and instead of index.css:
 *
 *   @import '@whatsaaaa/design-system/tailwind.css';
 *
 * It brings Tailwind and everything index.css brings, in cascade layers, gives Tailwind the
 * system's tokens as its theme, and brings the dark: and light: variants of tailwind/variants.css.
 * Written by the CSS build from the imports of index.css.
 *
 * The layers, in the order they win:
 *
 *   theme       Tailwind's theme variables, then the tokens and the icons
 *   base        Tailwind's preflight, then the system's base.css: its page defaults, focus
 *               ring and selection win over the preflight, and every utility wins over both
 *   components  the rest of index.css, the system's classes: ws-prose, the terminal frame
 *               and every other piece
 *   utilities   Tailwind's utilities
 *
 * CSS outside any layer wins over all of them. The fonts are @font-face rules, which no layer
 * orders.
 */
@layer theme, base, components, utilities;

/* Within a layer the later wins: Tailwind's theme and preflight come before the system's. */
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
${imports.join('\n')}
@import 'tailwindcss/utilities.css' layer(utilities);
@import './tailwind/theme.css';
@import './tailwind/variants.css';
`
}
