import { describe, expect, it } from 'vitest'
import type { LessonFile } from './lessonFiles.ts'
import { loadRoutes, ROUTES_DIR } from './routeFiles.ts'
import { seedContent } from './seedLessons.ts'
import type { SeedRow } from './seedRoutes.ts'

const routes = await loadRoutes(ROUTES_DIR)

const SECTIONS = [
  'Objetivo',
  'Lo esencial',
  'Explicación',
  'Ejemplo práctico',
  'Errores comunes',
  'Práctica (15 minutos)',
  'Repaso',
  'Respuestas',
  'Para profundizar',
]

function lesson(overrides: Partial<LessonFile> = {}): LessonFile {
  const id = overrides.id ?? 'cl-f0-t1'
  return {
    file: `cloud/cl-f0/${id}.md`,
    id,
    track: 'cloud',
    phase: 'cl-f0',
    title: 'Qué es la nube',
    minutes: 25,
    updated: '2026-11-24',
    content: SECTIONS.map((section) => `## ${section}\n\nTexto.\n`).join('\n'),
    hash: 'abc',
    images: [],
    ...overrides,
  }
}

const second = lesson({ id: 'cl-f0-t2', title: 'Modelos de servicio', hash: 'def' })

/** Base en memoria con el mismo upsert que Postgres (lessons, por topic_id). */
function memoryStore() {
  const tables = new Map<string, Map<string, SeedRow>>()
  const writes: string[] = []
  const upsert = (table: string, rows: readonly SeedRow[], key: 'id' | 'topic_id') => {
    writes.push(table)
    const current = tables.get(table) ?? new Map<string, SeedRow>()
    for (const row of rows) {
      const id = String(row[key])
      current.set(id, { ...current.get(id), ...row })
    }
    tables.set(table, current)
    return Promise.resolve()
  }
  const rowsOf = (table: string) => [...(tables.get(table)?.values() ?? [])]
  return {
    writes,
    rowsOf,
    store: {
      read: (table: string) => Promise.resolve(rowsOf(table)),
      upsert: (table: string, rows: readonly SeedRow[]) => upsert(table, rows, 'id'),
      readLessonIds: () => Promise.resolve(rowsOf('lessons').map((row) => String(row.topic_id))),
      upsertLessons: (rows: readonly object[]) =>
        upsert('lessons', rows as readonly SeedRow[], 'topic_id'),
    },
  }
}

function logger() {
  const lines: string[] = []
  const warnings: string[] = []
  return {
    lines,
    warnings,
    log: {
      info: (text: string) => void lines.push(text),
      warn: (text: string) => void warnings.push(text),
    },
  }
}

describe('seedContent', () => {
  it('carga las rutas y después las lecciones', async () => {
    const { store, rowsOf, writes } = memoryStore()
    const { log, lines, warnings } = logger()
    await seedContent(store, { routes, lessons: [lesson(), second] }, log)
    expect(writes).toEqual(['tracks', 'phases', 'topics', 'checklist_items', 'lessons'])
    expect(rowsOf('lessons')[0]).toEqual({
      topic_id: 'cl-f0-t1',
      content_md: lesson().content,
      minutes: 25,
      updated: '2026-11-24',
      content_hash: 'abc',
    })
    expect(lines).toContain('✓ lessons: 2')
    expect(warnings).toEqual([])
  })

  it('es idempotente: repetirlo deja lo mismo, y un cambio se actualiza', async () => {
    const { store, rowsOf } = memoryStore()
    const { log } = logger()
    await seedContent(store, { routes, lessons: [lesson(), second] }, log)
    await seedContent(store, { routes, lessons: [lesson(), second] }, log)
    expect(rowsOf('lessons')).toHaveLength(2)
    await seedContent(store, { routes, lessons: [lesson({ minutes: 30 }), second] }, log)
    expect(rowsOf('lessons').map((row) => row.minutes)).toEqual([30, 25])
  })

  it('un id que no existe en topics lo detiene con un mensaje claro, sin escribir nada', async () => {
    const { store, writes } = memoryStore()
    const unknown = lesson({ id: 'cl-f0-t99', file: 'cloud/cl-f0/cl-f0-t99.md' })
    await expect(
      seedContent(store, { routes, lessons: [lesson(), unknown] }, logger().log),
    ).rejects.toThrow(
      'No se cargó nada:\n- cloud/cl-f0/cl-f0-t99.md: el id «cl-f0-t99» no existe en topics. ' +
        'Revisa el id del frontmatter o agrega ese tema a su ruta en src/data/routes.',
    )
    expect(writes).toEqual([])
  })

  it('lista todos los ids desconocidos de una vez', async () => {
    const { store } = memoryStore()
    const bad = ['cl-f0-t98', 'cl-f0-t99'].map((id) => lesson({ id }))
    await expect(seedContent(store, { routes, lessons: bad }, logger().log)).rejects.toThrow(
      /cl-f0-t98[^]*cl-f0-t99/,
    )
  })

  it('vale el id de un tema que está en la base aunque ya no esté en los archivos', async () => {
    const { store, rowsOf } = memoryStore()
    await store.upsert('topics', [{ id: 'viejo-t1', phase_id: 'viejo', title: 'Viejo' }])
    await store.upsert('phases', [{ id: 'viejo', track_id: 'vieja' }])
    const old = lesson({ id: 'viejo-t1', track: 'vieja', phase: 'viejo', title: 'Viejo' })
    await seedContent(store, { routes, lessons: [old] }, logger().log)
    expect(rowsOf('lessons').map((row) => row.topic_id)).toEqual(['viejo-t1'])
  })

  it('la ruta y la fase del frontmatter deben ser las del tema', async () => {
    const { store, writes } = memoryStore()
    const wrong = lesson({ track: 'automatizacion', phase: 'f0' })
    await expect(seedContent(store, { routes, lessons: [wrong] }, logger().log)).rejects.toThrow(
      '- cloud/cl-f0/cl-f0-t1.md: el tema cl-f0-t1 es de la ruta «cloud», fase «cl-f0», y el ' +
        'frontmatter dice «automatizacion», «f0».',
    )
    expect(writes).toEqual([])
  })

  it('dos archivos para el mismo tema: dice cuáles', async () => {
    const { store } = memoryStore()
    const copy = lesson({ file: 'cloud/otra/cl-f0-t1.md' })
    await expect(
      seedContent(store, { routes, lessons: [lesson(), copy] }, logger().log),
    ).rejects.toThrow(
      'el tema cl-f0-t1 tiene dos archivos: cloud/cl-f0/cl-f0-t1.md y cloud/otra/cl-f0-t1.md.',
    )
  })

  it('una ruta inválida también lo detiene antes de escribir', async () => {
    const { store, writes } = memoryStore()
    const [first] = routes
    if (!first) throw new Error('Falta una ruta')
    await expect(
      seedContent(store, { routes: [...routes, first], lessons: [lesson()] }, logger().log),
    ).rejects.toThrow('Id de ruta repetido')
    expect(writes).toEqual([])
  })

  it('avisa, sin detenerse, si falta una sección o el título es otro', async () => {
    const { store, rowsOf } = memoryStore()
    const { log, warnings } = logger()
    const odd = lesson({ title: 'La nube', content: '## Objetivo\n\nHola\n' })
    await seedContent(store, { routes, lessons: [odd] }, log)
    expect(warnings.join('\n')).toContain(
      'cloud/cl-f0/cl-f0-t1.md: faltan las secciones Lo esencial, Explicación',
    )
    expect(warnings.join('\n')).toContain(
      'cloud/cl-f0/cl-f0-t1.md: el título dice «La nube» y el tema se llama «Qué es la nube».',
    )
    expect(rowsOf('lessons')).toHaveLength(1)
  })

  it('avisa de las lecciones que sobran en la base, pero no las borra', async () => {
    const { store, rowsOf } = memoryStore()
    await seedContent(store, { routes, lessons: [lesson(), second] }, logger().log)
    const { log, warnings } = logger()
    await seedContent(store, { routes, lessons: [lesson()] }, log)
    expect(warnings.join('\n')).toContain(
      'lessons: en la base hay lecciones sin archivo: cl-f0-t2.',
    )
    expect(rowsOf('lessons')).toHaveLength(2)
  })

  it('sin lecciones carga solo las rutas', async () => {
    const { store, writes } = memoryStore()
    await seedContent(store, { routes, lessons: [] }, logger().log)
    expect(writes).not.toContain('lessons')
  })
})
