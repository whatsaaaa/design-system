/**
 * The code theme for Shiki, built from the tokens, for VitePress, Astro and anything else
 * that highlights with Shiki. One theme for both page themes: code blocks stay dark.
 *
 * The official Rosé Pine code theme sets keywords in pine, which is 3.2:1 on the code
 * background. This one keeps every syntax color at AA.
 */
import { resolver } from '../../dist/tokens.js'

const tokens = resolver.apply({ theme: 'dark' })
type ColorId =
  | 'code.bg'
  | 'code.text'
  | 'code.selection'
  | (`syntax.${string}` & keyof typeof tokens)

const channel = (component: number | null) =>
  Math.round((component ?? 0) * 255)
    .toString(16)
    .padStart(2, '0')

function hex(id: ColorId): string {
  const { components, alpha } = tokens[id].$value
  return `#${components.map(channel).join('')}${alpha === 1 ? '' : channel(alpha)}`
}

const rule = (scope: string[], foreground: string, fontStyle?: string) => ({
  scope,
  settings: fontStyle ? { foreground, fontStyle } : { foreground },
})

/** A TextMate theme, the format Shiki takes. */
export const codeTheme = {
  name: 'whatsaaaa',
  type: 'dark' as const,
  colors: {
    'editor.background': hex('code.bg'),
    'editor.foreground': hex('code.text'),
    'editor.selectionBackground': hex('code.selection'),
  },
  tokenColors: [
    rule(['comment', 'punctuation.definition.comment'], hex('syntax.comment'), 'italic'),
    rule(
      [
        'keyword',
        'storage',
        'storage.type',
        'storage.modifier',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
      ],
      hex('syntax.keyword'),
    ),
    rule(
      ['string', 'string.quoted', 'string.template', 'punctuation.definition.string'],
      hex('syntax.string'),
    ),
    rule(
      ['entity.name.function', 'support.function', 'meta.function-call', 'variable.function'],
      hex('syntax.function'),
    ),
    rule(
      [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.name.tag',
        'entity.other.attribute-name',
        'support.type.property-name',
        'meta.object-literal.key',
      ],
      hex('syntax.type'),
    ),
    rule(
      [
        'constant',
        'constant.numeric',
        'constant.language',
        'constant.character',
        'variable.language',
        'support.constant',
      ],
      hex('syntax.constant'),
    ),
    rule(
      ['punctuation', 'meta.brace', 'keyword.operator', 'meta.delimiter'],
      hex('syntax.punctuation'),
    ),
    rule(
      ['variable', 'variable.other', 'variable.parameter', 'meta.embedded', 'source'],
      hex('code.text'),
    ),
    rule(['markup.heading', 'markup.bold'], hex('syntax.keyword'), 'bold'),
    rule(['markup.italic'], hex('code.text'), 'italic'),
    rule(['markup.underline.link', 'markup.inline.raw'], hex('syntax.type')),
    rule(['markup.inserted'], hex('syntax.type')),
    rule(['markup.deleted'], hex('syntax.keyword')),
  ],
}
