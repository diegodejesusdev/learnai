// Frontmatter de las lecciones: datos «clave: valor» entre dos líneas ---, antes del Markdown.
// Solo el YAML que usan (una línea por dato, sin listas ni anidados).

export interface Frontmatter {
  data: Partial<Record<string, string>>
  /** El Markdown que sigue, sin líneas vacías alrededor y con un salto al final. */
  body: string
}

/** El valor puede ir entre comillas (para YAML, si lleva dos puntos). */
function unquote(value: string): string {
  const quoted = /^(["'])(.*)\1$/.exec(value)
  return quoted?.[2] ?? value
}

/** Igual en cualquier sistema: sin BOM y con saltos de línea de Unix. */
export function normalizeText(text: string): string {
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
}

/** Lanza un error en español si falta o está mal escrito. */
export function parseFrontmatter(text: string): Frontmatter {
  const lines = normalizeText(text).split('\n')
  if (lines[0]?.trimEnd() !== '---') {
    throw new Error('falta el frontmatter: la primera línea debe ser ---.')
  }
  const end = lines.findIndex((line, index) => index > 0 && line.trimEnd() === '---')
  if (end === -1) throw new Error('el frontmatter no se cierra: falta la segunda línea ---.')

  const data: Partial<Record<string, string>> = {}
  for (const [index, line] of lines.slice(1, end).entries()) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue
    const pair = /^([\w-]+):(?:\s+(.*))?$/.exec(line.trim())
    const key = pair?.[1]
    if (key === undefined) {
      throw new Error(`línea ${index + 2} del frontmatter: «${line.trim()}» no es «clave: valor».`)
    }
    if (key in data) throw new Error(`la clave «${key}» está repetida en el frontmatter.`)
    data[key] = unquote((pair?.[2] ?? '').trim())
  }
  const body = lines
    .slice(end + 1)
    .join('\n')
    .trim()
  return { data, body: `${body}\n` }
}
