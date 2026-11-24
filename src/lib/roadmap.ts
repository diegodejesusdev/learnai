import type { ChecklistItem, Phase, Topic } from '@/types/curriculum'

/** Una ruta de estudio con sus fases y su checklist final. */
export interface Track {
  id: string
  order: number
  title: string
  goal: string
  phases: readonly Phase[]
  checklist: readonly ChecklistItem[]
}

export interface TopicWithPhase {
  topic: Topic
  phase: Phase
}

export function findPhaseIn(
  phases: readonly Phase[],
  phaseId: string | undefined,
): Phase | undefined {
  return phases.find((phase) => phase.id === phaseId)
}

export function findTopicIn(
  phases: readonly Phase[],
  topicId: string | undefined,
): TopicWithPhase | undefined {
  for (const phase of phases) {
    const topic = phase.topics.find((candidate) => candidate.id === topicId)
    if (topic) return { topic, phase }
  }
  return undefined
}

export function phaseLabel(phase: Phase): string {
  return `Fase ${phase.order}`
}

// ── Rutas ────────────────────────────────────────────────────────────────────

/** Lo que identifica un tema o un proyecto en una sesión, un temporizador o una conversación. */
export interface TargetIds {
  topicId: string | null
  projectPhaseId: string | null
}

export function findTrack(
  tracks: readonly Track[],
  id: string | null | undefined,
): Track | undefined {
  return tracks.find((track) => track.id === id)
}

/** La ruta activa: la guardada en los ajustes o, si no hay (o ya no existe), la primera. */
export function resolveActiveTrack(
  tracks: readonly Track[],
  id: string | null | undefined,
): Track | undefined {
  return findTrack(tracks, id) ?? tracks[0]
}

/** La ruta activa primero; las demás, en su orden. */
export function activeFirst(tracks: readonly Track[], activeId: string): Track[] {
  return [
    ...tracks.filter((track) => track.id === activeId),
    ...tracks.filter((track) => track.id !== activeId),
  ]
}

/** Las fases de todas las rutas. Los ids no se repiten entre rutas (el seed lo revisa). */
export function allPhases(tracks: readonly Track[]): Phase[] {
  return tracks.flatMap((track) => track.phases)
}

/** La ruta a la que pertenece un tema o un proyecto. */
export function trackOfTarget(tracks: readonly Track[], target: TargetIds): Track | undefined {
  return tracks.find((track) =>
    target.topicId !== null
      ? findTopicIn(track.phases, target.topicId) !== undefined
      : findPhaseIn(track.phases, target.projectPhaseId ?? undefined) !== undefined,
  )
}

/** «Ingeniería de datos · Fase 1»: fuera de la página de una ruta, «Fase 1» sola es ambigua. */
export function trackPhaseLabel(track: Track, phase: Phase): string {
  return `${track.title} · ${phaseLabel(phase)}`
}
