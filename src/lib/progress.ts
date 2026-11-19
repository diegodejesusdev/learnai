import type { Phase } from '@/types/curriculum'
import type { ProgressStatus, StatusMap } from '@/types/progress'

export interface Progress {
  done: number
  total: number
  /** Entre 0 y 1. */
  ratio: number
}

function toProgress(done: number, total: number): Progress {
  return { done, total, ratio: total === 0 ? 0 : done / total }
}

export function statusOf(statuses: StatusMap, id: string): ProgressStatus {
  return statuses[id] ?? 'pendiente'
}

/**
 * Progreso de una fase = (temas hechos + proyecto hecho) / (temas + 1).
 * Solo cuenta lo que está «hecho» (ver docs/SPEC.md §4.1).
 */
export function phaseProgress(
  phase: Phase,
  topicStatuses: StatusMap,
  projectStatuses: StatusMap,
): Progress {
  const topicsDone = phase.topics.filter((topic) => statusOf(topicStatuses, topic.id) === 'hecho')
  const projectDone = statusOf(projectStatuses, phase.id) === 'hecho' ? 1 : 0
  return toProgress(topicsDone.length + projectDone, phase.topics.length + 1)
}

/** Progreso total sobre todos los temas y proyectos de la ruta. */
export function totalProgress(
  phases: readonly Phase[],
  topicStatuses: StatusMap,
  projectStatuses: StatusMap,
): Progress {
  return phases.reduce(
    (acc, phase) => {
      const { done, total } = phaseProgress(phase, topicStatuses, projectStatuses)
      return toProgress(acc.done + done, acc.total + total)
    },
    toProgress(0, 0),
  )
}
