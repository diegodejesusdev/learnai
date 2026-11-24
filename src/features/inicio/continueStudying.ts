import type { StudySession } from '@/features/historial/sessionsApi'
import type { ActiveTimer } from '@/features/temporizador/timerModel'
import { nextTopic, statusOf } from '@/lib/progress'
import type { TargetIds } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import type { StatusMap } from '@/types/progress'

export interface ContinueSuggestion {
  /** timer: hay una sesión en curso · last: lo de la última sesión · next: el siguiente tema. */
  kind: 'timer' | 'last' | 'next'
  target: TargetIds
  /** Adónde lleva «Seguir estudiando». */
  to: string
  /** Inicio de la última sesión (solo en 'last'). */
  lastStartedAt: string | null
}

export function studyUrl(target: TargetIds): string {
  return target.topicId !== null
    ? `/estudiar?tema=${target.topicId}`
    : `/estudiar?proyecto=${target.projectPhaseId ?? ''}`
}

interface ContinueInput {
  timer: ActiveTimer | null
  latest: StudySession | null
  /** Las fases de la ruta activa: de ahí sale el siguiente tema. */
  phases: readonly Phase[]
  topicStatuses: StatusMap
  projectStatuses: StatusMap
}

/**
 * Qué abre «Seguir estudiando»: la sesión en curso; si no hay, el tema o proyecto de la última
 * sesión, de cualquier ruta (si aún no está hecho); si no, el siguiente tema de la ruta activa.
 */
export function continueSuggestion(input: ContinueInput): ContinueSuggestion | null {
  const { timer, latest, phases, topicStatuses, projectStatuses } = input
  if (timer) {
    const { topicId, projectPhaseId } = timer
    return {
      kind: 'timer',
      target: { topicId, projectPhaseId },
      to: '/estudiar',
      lastStartedAt: null,
    }
  }
  if (latest) {
    const { topicId, projectPhaseId } = latest.target
    const status =
      topicId !== null
        ? statusOf(topicStatuses, topicId)
        : statusOf(projectStatuses, projectPhaseId)
    if (status !== 'hecho') {
      return {
        kind: 'last',
        target: latest.target,
        to: studyUrl(latest.target),
        lastStartedAt: latest.startedAt,
      }
    }
  }
  const next = nextTopic(phases, topicStatuses)
  if (!next) return null
  const target = { topicId: next.topic.id, projectPhaseId: null }
  return { kind: 'next', target, to: studyUrl(target), lastStartedAt: null }
}
