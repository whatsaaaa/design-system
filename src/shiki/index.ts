/**
 * The code theme for Shiki, built from the tokens, for VitePress, Astro and anything else
 * that highlights with Shiki. One theme for both page themes: code blocks stay dark.
 *
 * The official Rosé Pine code theme sets keywords in pine, which is 3.2:1 on the code
 * background. This one keeps every syntax color at AA.
 */
import { resolver } from '../../dist/tokens.js'
import { colorHex } from '../color.ts'

const tokens = resolver.apply({ theme: 'dark' })
type ColorId =
  | 'code.bg'
  | 'code.text'
  | 'code.selection'
  | (`syntax.${string}` & keyof typeof tokens)

const hex = (id: ColorId) => colorHex(tokens[id].$value)

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

/** The part of a Shiki line element the transformer writes to. */
interface LineElement {
  properties: Record<string, unknown>
}

/**
 * A Shiki transformer for a code block that wraps, `ws-code--wrap`: it gives each line its
 * hanging indent, `--ws-code-hang`, the width of its indent plus two, a tab counted as two as
 * the block sets it. The rest of a wrapped line then starts one level in from the line's own
 * text, so the shape of the code still reads.
 *
 *   codeToHtml(code, { lang: 'json', theme: codeTheme, transformers: [hangingIndent()] })
 */
export function hangingIndent() {
  let source = ''
  let lines: string[] = []
  return {
    name: 'whatsaaaa:hanging-indent',
    line(this: { source: string }, node: LineElement, line: number) {
      if (this.source !== source) {
        source = this.source
        lines = source.split(/\r?\n/)
      }
      const indent = /^[\t ]*/.exec(lines[line - 1] ?? '')![0]
      const hang = indent.replaceAll('\t', '  ').length + 2
      const style = node.properties.style
      node.properties.style = `${typeof style === 'string' && style ? `${style.replace(/;?$/, ';')}` : ''}--ws-code-hang:${hang}`
    },
  }
}
