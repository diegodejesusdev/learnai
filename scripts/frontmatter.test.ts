import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from './frontmatter.ts'

const text = (lines: string[]) => lines.join('\n')

describe('parseFrontmatter', () => {
  it('separa los datos del contenido', () => {
    const source = text([
      '---',
      'id: cl-f0-t1',
      'minutes: 25',
      '---',
      '',
      '## Objetivo',
      '',
      'Hola',
    ])
    expect(parseFrontmatter(source)).toEqual({
      data: { id: 'cl-f0-t1', minutes: '25' },
      body: '## Objetivo\n\nHola\n',
    })
  })

  it('el valor puede llevar dos puntos, tildes y comillas por dentro', () => {
    const source = text(['---', 'title: SLI, SLO: qué miden y "por qué"', '---', 'x'])
    expect(parseFrontmatter(source).data).toEqual({ title: 'SLI, SLO: qué miden y "por qué"' })
  })

  it('quita las comillas que rodean el valor', () => {
    const source = text(['---', 'a: "IAM: políticas"', "b: 'uno'", 'c: "sin cerrar', '---', 'x'])
    expect(parseFrontmatter(source).data).toEqual({
      a: 'IAM: políticas',
      b: 'uno',
      c: '"sin cerrar',
    })
  })

  it('ignora líneas vacías y comentarios', () => {
    const source = text(['---', '', '# nota para mí', 'id: x', '---', 'y'])
    expect(parseFrontmatter(source).data).toEqual({ id: 'x' })
  })

  it('acepta los saltos de línea de Windows y la marca BOM', () => {
    const source = `\uFEFF${['---', 'id: x', '---', '', '## Uno', 'dos'].join('\r\n')}`
    expect(parseFrontmatter(source)).toEqual({ data: { id: 'x' }, body: '## Uno\ndos\n' })
  })

  it('una línea --- dentro del contenido no es frontmatter', () => {
    const source = text(['---', 'id: x', '---', 'antes', '', '---', '', 'después'])
    expect(parseFrontmatter(source).body).toBe('antes\n\n---\n\ndespués\n')
  })

  it('sin frontmatter lo dice', () => {
    expect(() => parseFrontmatter('## Objetivo')).toThrow(
      'falta el frontmatter: la primera línea debe ser ---.',
    )
    expect(() => parseFrontmatter('')).toThrow('falta el frontmatter')
  })

  it('si no se cierra, lo dice', () => {
    expect(() => parseFrontmatter(text(['---', 'id: x', '', '## Objetivo']))).toThrow(
      'el frontmatter no se cierra: falta la segunda línea ---.',
    )
  })

  it('una línea que no es «clave: valor» dice cuál es', () => {
    expect(() => parseFrontmatter(text(['---', 'id: x', 'sin dos puntos', '---', 'y']))).toThrow(
      'línea 3 del frontmatter: «sin dos puntos» no es «clave: valor».',
    )
  })

  it('una clave repetida dice cuál es', () => {
    expect(() => parseFrontmatter(text(['---', 'id: x', 'id: y', '---', 'z']))).toThrow(
      'la clave «id» está repetida en el frontmatter.',
    )
  })
})
