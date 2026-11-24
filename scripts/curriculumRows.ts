import type { Curriculum } from '../src/types/curriculum.ts'
import type { TablesInsert } from '../src/types/database.ts'

export interface CurriculumRows {
  track: TablesInsert<'tracks'>
  phases: TablesInsert<'phases'>[]
  topics: TablesInsert<'topics'>[]
  checklist: TablesInsert<'checklist_items'>[]
}

/** Convierte el archivo de una ruta en las filas de las tablas de contenido. El orden sale de la posición. */
export function toCurriculumRows(curriculum: Curriculum): CurriculumRows {
  const trackId = curriculum.track.id
  return {
    track: {
      id: trackId,
      sort_order: curriculum.track.order,
      title: curriculum.track.title,
      goal: curriculum.goal,
    },
    phases: curriculum.phases.map((phase) => ({
      id: phase.id,
      track_id: trackId,
      sort_order: phase.order,
      title: phase.title,
      summary: phase.summary,
      estimated_weeks: phase.estimated_weeks,
      project_title: phase.project.title,
      project_description: phase.project.description,
    })),
    topics: curriculum.phases.flatMap((phase) =>
      phase.topics.map((topic, index) => ({
        id: topic.id,
        phase_id: phase.id,
        sort_order: index,
        title: topic.title,
        details: topic.details,
      })),
    ),
    checklist: curriculum.final_checklist.map((item, index) => ({
      id: item.id,
      track_id: trackId,
      sort_order: index,
      text: item.text,
    })),
  }
}

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  return ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)))
}

/**
 * Errores que impedirían un upsert correcto, en una ruta o entre rutas (un id repetido en otra
 * ruta pisaría su contenido). Lista vacía = todo bien.
 */
export function validateRoutes(routes: readonly Curriculum[]): string[] {
  if (routes.length === 0) return ['No hay ningún archivo de ruta.']
  const rows = routes.map(toCurriculumRows)
  const errors: string[] = []
  for (const [label, ids] of [
    ['ruta', rows.map(({ track }) => track.id)],
    ['fase', rows.flatMap(({ phases }) => phases.map((row) => row.id))],
    ['tema', rows.flatMap(({ topics }) => topics.map((row) => row.id))],
    ['ítem de checklist', rows.flatMap(({ checklist }) => checklist.map((row) => row.id))],
  ] as const) {
    for (const id of duplicates(ids)) errors.push(`Id de ${label} repetido: ${id}`)
  }
  const orders = routes.map((route) => route.track.order)
  for (const order of new Set(duplicates(orders.map(String)))) {
    const ids = routes.filter((route) => String(route.track.order) === order)
    errors.push(
      `Dos rutas con el mismo orden (${order}): ${ids.map((route) => route.track.id).join(', ')}`,
    )
  }
  for (const { track, phases, topics } of rows) {
    for (const row of [track, ...phases, ...topics]) {
      if (!row.title.trim()) errors.push(`Falta el título de ${row.id}`)
    }
    for (const phase of phases) {
      if (phase.estimated_weeks <= 0)
        errors.push(`${phase.id}: estimated_weeks debe ser mayor que 0`)
    }
  }
  return errors
}

/** Ids que están en la base pero ya no en los archivos de rutas. */
export function orphanIds(dbIds: readonly string[], jsonIds: readonly string[]): string[] {
  const keep = new Set(jsonIds)
  return dbIds.filter((id) => !keep.has(id))
}
