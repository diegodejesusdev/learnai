import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CONTENT_DIR, loadLessons, parseLesson } from './lessonFiles.ts'

const PATH = 'cloud/cl-f0/cl-f0-t1.md'

function lessonText(overrides: Record<string, string | null> = {}, body = '## Objetivo\n\nHola') {
  const data = {
    id: 'cl-f0-t1',
    track: 'cloud',
    phase: 'cl-f0',
    title: 'Qué es la nube',
    minutes: '25',
    updated: '2026-11-24',
    ...overrides,
  }
  const lines = Object.entries(data).flatMap(([key, value]) =>
    value === null ? [] : [`${key}: ${value}`],
  )
  return ['---', ...lines, '---', '', body].join('\n')
}

describe('parseLesson', () => {
  it('lee los datos y el contenido, sin el frontmatter', () => {
    expect(parseLesson(lessonText(), PATH)).toMatchObject({
      file: PATH,
      id: 'cl-f0-t1',
      track: 'cloud',
      phase: 'cl-f0',
      title: 'Qué es la nube',
      minutes: 25,
      updated: '2026-11-24',
      content: '## Objetivo\n\nHola\n',
    })
  })

  it('el hash cambia si cambia algo del archivo, y no por los saltos de línea de Windows', () => {
    const hash = (text: string) => parseLesson(text, PATH).hash
    expect(hash(lessonText())).toMatch(/^[0-9a-f]{64}$/)
    expect(hash(lessonText().replaceAll('\n', '\r\n'))).toBe(hash(lessonText()))
    expect(hash(lessonText({}, 'Otro'))).not.toBe(hash(lessonText()))
    expect(hash(lessonText({ minutes: '30' }))).not.toBe(hash(lessonText()))
  })

  it('dice qué archivo y qué dato falta', () => {
    expect(() => parseLesson(lessonText({ minutes: null, title: null }), PATH)).toThrow(
      'cloud/cl-f0/cl-f0-t1.md: en el frontmatter faltan title, minutes.',
    )
    expect(() => parseLesson(lessonText({ id: '' }), PATH)).toThrow('faltan id.')
    expect(() => parseLesson('## Objetivo', PATH)).toThrow(
      'cloud/cl-f0/cl-f0-t1.md: falta el frontmatter',
    )
  })

  it('los minutos son un número entero mayor que 0', () => {
    for (const minutes of ['25 min', '0', '-5', '2.5']) {
      expect(() => parseLesson(lessonText({ minutes }), PATH)).toThrow(
        `minutes debe ser un número entero mayor que 0 (dice «${minutes}»).`,
      )
    }
  })

  it('la fecha va como AAAA-MM-DD y debe existir', () => {
    for (const updated of ['24/11/2026', '2026-02-30', 'hoy']) {
      expect(() => parseLesson(lessonText({ updated }), PATH)).toThrow(
        `updated debe ser una fecha AAAA-MM-DD (dice «${updated}»).`,
      )
    }
  })

  it('el id debe ser el nombre del archivo', () => {
    expect(() => parseLesson(lessonText({ id: 'cl-f0-t2' }), PATH)).toThrow(
      'cloud/cl-f0/cl-f0-t1.md: el id «cl-f0-t2» no coincide con el nombre del archivo.',
    )
  })

  it('una lección sin contenido no se acepta', () => {
    expect(() => parseLesson(lessonText({}, '  '), PATH)).toThrow('no tiene contenido.')
  })
})

describe('loadLessons', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'learnai-lecciones-'))
  })
  afterEach(() => rm(dir, { recursive: true }))

  async function write(path: string, text: string) {
    await mkdir(dirname(join(dir, path)), { recursive: true })
    await writeFile(join(dir, path), text)
  }

  it('carga las lecciones de Cloud que están en content/', async () => {
    const lessons = await loadLessons(CONTENT_DIR)
    const first = lessons.filter((lesson) => lesson.phase === 'cl-f0')
    expect(first.map((lesson) => lesson.id)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `cl-f0-t${n}`),
    )
    expect(first[0]?.content.startsWith('## Objetivo')).toBe(true)
  })

  it('busca en todas las carpetas y solo mira los .md', async () => {
    await write('cloud/cl-f0/cl-f0-t1.md', lessonText())
    await write('cloud/cl-f1/cl-f1-t2.md', lessonText({ id: 'cl-f1-t2', phase: 'cl-f1' }))
    await write('cloud/.DS_Store', 'basura')
    await write('cloud/cl-f0/imagen.png', 'basura')
    const lessons = await loadLessons(dir)
    expect(lessons.map((lesson) => lesson.file)).toEqual([
      'cloud/cl-f0/cl-f0-t1.md',
      'cloud/cl-f1/cl-f1-t2.md',
    ])
  })

  it('los archivos ocultos que copia el Mac (._x.md) no son lecciones', async () => {
    await write('cloud/cl-f0/cl-f0-t1.md', lessonText())
    await write('cloud/cl-f0/._cl-f0-t1.md', 'basura')
    expect(await loadLessons(dir)).toHaveLength(1)
  })

  it('si la carpeta no existe, no hay lecciones', async () => {
    expect(await loadLessons(join(dir, 'no-existe'))).toEqual([])
  })

  it('reúne los errores de todos los archivos', async () => {
    await write('cloud/cl-f0/cl-f0-t1.md', '## Objetivo')
    await write('cloud/cl-f0/cl-f0-t2.md', lessonText({ id: 'cl-f0-t2', minutes: 'x' }))
    await expect(loadLessons(dir)).rejects.toThrow(
      /cl-f0-t1\.md: falta el frontmatter[^]*cl-f0-t2\.md: minutes debe ser/,
    )
  })
})
