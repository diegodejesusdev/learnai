import type { Emphasis, Paragraph, Parent, PhrasingContent, Root, RootContent } from 'mdast'

// Una imagen sola en su párrafo es una figura. Si justo debajo hay un párrafo que es todo cursiva,
// ese es su pie:
//
//   ![descripción](img/archivo.svg)
//
//   *Pie de la imagen.*
//
// Se convierten en <figure><img><figcaption>…</figcaption></figure>.

const isImageOnly = (node: RootContent | undefined): node is Paragraph =>
  node?.type === 'paragraph' && node.children.length === 1 && node.children[0]?.type === 'image'

const emphasisOnly = (node: RootContent | undefined) =>
  node?.type === 'paragraph' && node.children.length === 1 && node.children[0]?.type === 'emphasis'
    ? node.children[0]
    : null

/**
 * Un nodo con otro nombre de etiqueta: mdast-util-to-hast lo vuelve ese elemento (data.hName).
 * Los tipos de mdast no conocen figure ni figcaption, de ahí el cast.
 */
function element(hName: string, children: RootContent[]): Paragraph {
  return { type: 'paragraph', children, data: { hName } } as unknown as Paragraph
}

function figure(image: PhrasingContent, caption: Emphasis | null): Paragraph {
  return element('figure', [image, ...(caption ? [element('figcaption', caption.children)] : [])])
}

function wrap(parent: Parent) {
  const children: RootContent[] = []
  for (let index = 0; index < parent.children.length; index += 1) {
    const node = parent.children[index]
    if (node === undefined) continue
    if ('children' in node) wrap(node)
    const image = isImageOnly(node) ? node.children[0] : undefined
    if (!image) {
      children.push(node)
      continue
    }
    const caption = emphasisOnly(parent.children[index + 1])
    if (caption) index += 1
    children.push(figure(image, caption))
  }
  parent.children = children
}

export function remarkLessonFigure() {
  return (tree: Root) => wrap(tree)
}
