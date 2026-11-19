import type { Curriculum } from '../src/types/curriculum.ts'
import type { TablesInsert } from '../src/types/database.ts'

export interface CurriculumRows {
  meta: TablesInsert<'curriculum_meta'>
  phases: TablesInsert<'phases'>[]
  topics: TablesInsert<'topics'>[]
  checklist: TablesInsert<'checklist_items'>[]
}

/** Convierte curriculum.json en las filas de las tablas de contenido. El orden sale de la posición. */
export function toCurriculumRows(curriculum: Curriculum): CurriculumRows {
  return {
    meta: { id: 1, version: curriculum.version, title: curriculum.title, goal: curriculum.goal },
    phases: curriculum.phases.map((phase) => ({
      id: phase.id,
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
      sort_order: index,
      text: item.text,
    })),
  }
}

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  return ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)))
}

/** Errores que impedirían un upsert correcto. Lista vacía = todo bien. */
export function validateCurriculum(curriculum: Curriculum): string[] {
  const rows = toCurriculumRows(curriculum)
  const errors: string[] = []
  for (const [label, ids] of [
    ['fase', rows.phases.map((row) => row.id)],
    ['tema', rows.topics.map((row) => row.id)],
    ['ítem de checklist', rows.checklist.map((row) => row.id)],
  ] as const) {
    for (const id of duplicates(ids)) errors.push(`Id de ${label} repetido: ${id}`)
  }
  for (const row of [...rows.phases, ...rows.topics]) {
    if (!row.title.trim()) errors.push(`Falta el título de ${row.id}`)
  }
  for (const phase of curriculum.phases) {
    if (phase.estimated_weeks <= 0) errors.push(`${phase.id}: estimated_weeks debe ser mayor que 0`)
  }
  return errors
}

/** Ids que están en la base pero ya no en curriculum.json. */
export function orphanIds(dbIds: readonly string[], jsonIds: readonly string[]): string[] {
  const keep = new Set(jsonIds)
  return dbIds.filter((id) => !keep.has(id))
}
