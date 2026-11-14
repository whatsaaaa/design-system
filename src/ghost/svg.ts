/** The namespace of SVG. */
export const SVG = 'http://www.w3.org/2000/svg'

/** An SVG element with its attributes, built without markup. */
export function svgElement<K extends keyof SVGElementTagNameMap>(
  document: Document,
  name: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG, name)
  for (const [attribute, value] of Object.entries(attributes))
    element.setAttribute(attribute, value)
  return element
}
