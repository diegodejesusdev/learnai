import { describe, expect, it } from 'vitest'
import type { Curriculum } from '../src/types/curriculum.ts'
import { orphanIds, toCurriculumRows, validateRoutes } from './curriculumRows.ts'
import { loadRoutes, ROUTES_DIR } from './routeFiles.ts'

const routes = await loadRoutes(ROUTES_DIR)
const [automation, data] = routes
if (!automation || !data) throw new Error('Faltan rutas')

describe('toCurriculumRows', () => {
  it('automatización: 9 fases, 100 temas y 14 ítems', () => {
    const rows = toCurriculumRows(automation)
    expect(rows.phases).toHaveLength(9)
    expect(rows.topics).toHaveLength(100)
    expect(rows.checklist).toHaveLength(14)
  })

  it('ingeniería de datos: 13 fases, 110 temas y 15 ítems', () => {
    const rows = toCurriculumRows(data)
    expect(rows.phases).toHaveLength(13)
    expect(rows.topics).toHaveLength(110)
    expect(rows.checklist).toHaveLength(15)
  })

  it('la fila de la ruta sale del bloque track y de la meta del archivo', () => {
    expect(toCurriculumRows(automation).track).toEqual({
      id: 'automatizacion',
      sort_order: 1,
      title: 'Automatización para negocios',
      goal: automation.goal,
    })
    expect(toCurriculumRows(data).track).toMatchObject({ id: 'ingenieria-datos', sort_order: 2 })
  })

  it('cada fase y cada ítem llevan su ruta', () => {
    const rows = toCurriculumRows(data)
    for (const row of [...rows.phases, ...rows.checklist]) {
      expect(row.track_id).toBe('ingenieria-datos')
    }
  })

  it('aplana el proyecto en la fase y numera los temas dentro de su fase', () => {
    const rows = toCurriculumRows(automation)
    expect(rows.phases[1]).toMatchObject({
      id: 'f1',
      sort_order: 1,
      project_title: 'Primera API y webhook',
    })
    const f1Topics = rows.topics.filter((topic) => topic.phase_id === 'f1')
    expect(f1Topics.map((topic) => topic.sort_order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(f1Topics[9]?.id).toBe('f1-t10')
  })
})

/** La misma ruta con otro id de ruta y otros ids de fase, tema e ítem. */
function renamed(route: Curriculum, trackId: string): Curriculum {
  return {
    ...route,
    track: { ...route.track, id: trackId, order: 9 },
    phases: route.phases.map((phase) => ({
      ...phase,
      id: `${trackId}-${phase.id}`,
      topics: phase.topics.map((topic) => ({ ...topic, id: `${trackId}-${topic.id}` })),
    })),
    final_checklist: route.final_checklist.map((item) => ({
      ...item,
      id: `${trackId}-${item.id}`,
    })),
  }
}

describe('validateRoutes', () => {
  it('las rutas actuales son válidas', () => {
    expect(validateRoutes(routes)).toEqual([])
  })

  it('detecta un id repetido dentro de una ruta', () => {
    const [first, ...rest] = automation.phases
    const firstTopic = first?.topics[0]
    if (!first || !firstTopic) throw new Error('Sin datos')
    const broken: Curriculum = {
      ...automation,
      phases: [{ ...first, topics: [...first.topics, firstTopic] }, ...rest],
    }
    expect(validateRoutes([broken])).toEqual(['Id de tema repetido: f0-t1'])
  })

  it('detecta un id que ya usa otra ruta: el upsert pisaría su contenido', () => {
    const third = renamed(data, 'otra')
    const [first, ...rest] = third.phases
    if (!first) throw new Error('Sin datos')
    const clash: Curriculum = { ...third, phases: [{ ...first, id: 'f0' }, ...rest] }
    expect(validateRoutes([automation, data, clash])).toEqual(['Id de fase repetido: f0'])
  })

  it('detecta dos archivos con la misma ruta o el mismo orden', () => {
    const copy = { ...renamed(data, 'otra'), track: { ...data.track, order: 9 } }
    expect(validateRoutes([data, copy])).toEqual(['Id de ruta repetido: ingenieria-datos'])
    const sameOrder = renamed(data, 'otra')
    expect(
      validateRoutes([data, { ...sameOrder, track: { ...sameOrder.track, order: 2 } }]),
    ).toEqual(['Dos rutas con el mismo orden (2): ingenieria-datos, otra'])
  })

  it('exige título y semanas', () => {
    const [first, ...rest] = data.phases
    if (!first) throw new Error('Sin datos')
    const broken: Curriculum = {
      ...data,
      phases: [{ ...first, title: ' ', estimated_weeks: 0 }, ...rest],
    }
    expect(validateRoutes([broken])).toEqual([
      'Falta el título de de-f0',
      'de-f0: estimated_weeks debe ser mayor que 0',
    ])
  })

  it('sin rutas no hay nada que cargar', () => {
    expect(validateRoutes([])).toEqual(['No hay ningún archivo de ruta.'])
  })
})

describe('orphanIds', () => {
  it('lista lo que sobra en la base', () => {
    expect(orphanIds(['f0-t1', 'f0-t9'], ['f0-t1'])).toEqual(['f0-t9'])
  })
})
