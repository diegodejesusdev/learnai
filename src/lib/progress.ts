import type { Phase } from '@/types/curriculum'
import type { ProgressStatus, StatusMap } from '@/types/progress'
import type { TopicWithPhase } from './roadmap'

export interface Progress {
  done: number
  total: number
  /** Entre 0 y 1. */
  ratio: number
}

function toProgress(done: number, total: number): Progress {
  return { done, total, ratio: total === 0 ? 0 : done / total }
}

/** Si un id no tiene fila de progreso, está pendiente. */
export function statusOf(statuses: StatusMap, id: string): ProgressStatus {
  return statuses[id] ?? 'pendiente'
}

/** Un toque en el estado avanza: pendiente → en curso → hecho → pendiente. */
export function nextStatus(status: ProgressStatus): ProgressStatus {
  if (status === 'pendiente') return 'en_curso'
  if (status === 'en_curso') return 'hecho'
  return 'pendiente'
}

/** Progreso de una fase = temas hechos / temas de la fase. «En curso» no suma. */
export function phaseProgress(phase: Phase, topicStatuses: StatusMap): Progress {
  const done = phase.topics.filter((topic) => statusOf(topicStatuses, topic.id) === 'hecho')
  return toProgress(done.length, phase.topics.length)
}

/** Progreso total = temas hechos / todos los temas de la ruta. */
export function totalProgress(phases: readonly Phase[], topicStatuses: StatusMap): Progress {
  return phases.reduce(
    (acc, phase) => {
      const { done, total } = phaseProgress(phase, topicStatuses)
      return toProgress(acc.done + done, acc.total + total)
    },
    toProgress(0, 0),
  )
}

/** Cuántos de los ids están «hechos» (proyectos o ítems de la checklist). */
export function doneCount(ids: readonly string[], statuses: StatusMap): Progress {
  return toProgress(ids.filter((id) => statusOf(statuses, id) === 'hecho').length, ids.length)
}

/** Estado de una fase según sus temas: todos hechos → hecho; alguno empezado → en curso. */
export function phaseStatus(phase: Phase, topicStatuses: StatusMap): ProgressStatus {
  const statuses = phase.topics.map((topic) => statusOf(topicStatuses, topic.id))
  if (statuses.length > 0 && statuses.every((status) => status === 'hecho')) return 'hecho'
  if (statuses.some((status) => status !== 'pendiente')) return 'en_curso'
  return 'pendiente'
}

/**
 * Siguiente tema sugerido: el primer tema «en curso» en el orden de la ruta;
 * si no hay ninguno, el primer «pendiente». undefined si todo está hecho.
 */
export function nextTopic(
  phases: readonly Phase[],
  topicStatuses: StatusMap,
): TopicWithPhase | undefined {
  const ordered = phases.flatMap((phase) => phase.topics.map((topic) => ({ topic, phase })))
  return (
    ordered.find(({ topic }) => statusOf(topicStatuses, topic.id) === 'en_curso') ??
    ordered.find(({ topic }) => statusOf(topicStatuses, topic.id) === 'pendiente')
  )
}

// ── Filtros ──────────────────────────────────────────────────────────────────
export type StatusFilter = 'todos' | ProgressStatus

export const STATUS_FILTERS: readonly StatusFilter[] = ['todos', 'pendiente', 'en_curso', 'hecho']

/** Lee el filtro de la URL (?estado=…); cualquier valor desconocido es «todos». */
export function parseStatusFilter(value: string | null): StatusFilter {
  return STATUS_FILTERS.find((filter) => filter === value) ?? 'todos'
}

export function matchesFilter(status: ProgressStatus, filter: StatusFilter): boolean {
  return filter === 'todos' || status === filter
}

export function countByFilter(statuses: readonly ProgressStatus[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    todos: statuses.length,
    pendiente: 0,
    en_curso: 0,
    hecho: 0,
  }
  for (const status of statuses) counts[status] += 1
  return counts
}
