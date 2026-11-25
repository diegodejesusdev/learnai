import { describe, expect, it } from 'vitest'
import { isAnswers, missingSections, parseSections, slugify } from './lessonSections'

const markdown = (lines: string[]) => lines.join('\n')

describe('parseSections', () => {
  it('parte la lección por sus títulos ##, con el contenido de cada una', () => {
    const sections = parseSections(
      markdown([
        '## Objetivo',
        '',
        'Entender la nube.',
        '',
        '## Lo esencial',
        '',
        '- Uno',
        '- Dos',
      ]),
    )
    expect(sections.map(({ id, title, body }) => ({ id, title, body }))).toEqual([
      { id: 'objetivo', title: 'Objetivo', body: 'Entender la nube.' },
      { id: 'lo-esencial', title: 'Lo esencial', body: '- Uno\n- Dos' },
    ])
  })

  it('los ### son subtítulos de su sección, con la línea donde están', () => {
    const [section] = parseSections(
      markdown(['## Explicación', '', '### Regiones', '', 'Texto.', '', '### Zonas', '', 'Más.']),
    )
    expect(section?.subheadings).toEqual([
      { id: 'regiones', title: 'Regiones', line: 1 },
      { id: 'zonas', title: 'Zonas', line: 5 },
    ])
    expect(section?.body.split('\n')[4]).toBe('### Zonas')
  })

  it('un # dentro de un bloque de código no es un título', () => {
    const sections = parseSections(
      markdown([
        '## Ejemplo práctico',
        '',
        '```bash',
        '# AWS',
        '## no es una sección',
        'aws s3 ls',
        '```',
        '',
        '~~~text',
        '### tampoco',
        '```',
        '## ni esto',
        '~~~',
        '',
        '## Errores comunes',
      ]),
    )
    expect(sections.map((section) => section.title)).toEqual([
      'Ejemplo práctico',
      'Errores comunes',
    ])
    expect(sections[0]?.subheadings).toEqual([])
    expect(sections[0]?.body).toContain('## no es una sección')
  })

  it('un bloque de código dentro de una lista tampoco confunde', () => {
    const sections = parseSections(
      markdown([
        '## Práctica',
        '',
        '1. Crea el archivo:',
        '',
        '    ```bash',
        '## x',
        '    ```',
        '## Repaso',
      ]),
    )
    expect(sections.map((section) => section.title)).toEqual(['Práctica', 'Repaso'])
  })

  it('cada título tiene un id único, sin tildes ni signos', () => {
    const sections = parseSections(
      markdown(['## Práctica (15 minutos)', '### ¿Qué es?', '## Qué es', '## Contenido']),
    )
    expect(sections.map((section) => section.id)).toEqual([
      'practica-15-minutos',
      'que-es-2',
      // «contenido» ya es el id del <main> de la app.
      'contenido-2',
    ])
    expect(sections[0]?.subheadings[0]?.id).toBe('que-es')
  })

  it('el título del índice va sin formato', () => {
    const [section] = parseSections('## El comando `aws sts` y **sus** [opciones](https://x.co)')
    expect(section?.title).toBe('El comando aws sts y sus opciones')
  })

  it('lo que haya antes del primer título queda en una sección sin título', () => {
    const sections = parseSections(markdown(['Nota inicial.', '', '## Objetivo', 'x']))
    expect(sections.map(({ title, body }) => ({ title, body }))).toEqual([
      { title: '', body: 'Nota inicial.' },
      { title: 'Objetivo', body: 'x' },
    ])
  })

  it('una lección vacía no tiene secciones', () => {
    expect(parseSections('\n\n')).toEqual([])
  })
})

describe('slugify', () => {
  it('siempre da un id usable', () => {
    expect(slugify('IP, subredes y CIDR')).toBe('ip-subredes-y-cidr')
    expect(slugify('¿?')).toBe('seccion')
  })
})

describe('isAnswers', () => {
  it('reconoce la sección de respuestas, con o sin paréntesis', () => {
    const [answers, review, other] = parseSections(
      markdown(['## Respuestas (no mires)', 'x', '## Repaso', 'y', '## Respuestas HTTP', 'z']),
    )
    expect(answers && isAnswers(answers)).toBe(true)
    expect(review && isAnswers(review)).toBe(false)
    // Un título que solo empieza igual no se oculta.
    expect(other && isAnswers(other)).toBe(false)
  })
})

describe('missingSections', () => {
  const complete = [
    '## Objetivo',
    '## Lo esencial',
    '## Explicación',
    '## Ejemplo práctico',
    '## Errores comunes',
    '## Práctica (15 minutos)',
    '## Repaso',
    '## Respuestas',
    '## Para profundizar',
  ]

  it('una lección completa no tiene faltantes, aunque el título lleve la duración', () => {
    expect(missingSections(markdown(complete))).toEqual([])
  })

  it('dice cuáles faltan', () => {
    const partial = complete.filter((line) => !/Repaso|Objetivo/.test(line))
    expect(missingSections(markdown(partial))).toEqual(['Objetivo', 'Repaso'])
  })
})
