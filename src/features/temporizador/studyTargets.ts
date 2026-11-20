import { phaseLabel } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import type { StudyTargetRef } from './timerModel'

/** Algo que se puede estudiar: un tema o el proyecto de una fase. */
export interface StudyTarget {
  key: string
  kind: 'topic' | 'project'
  ref: StudyTargetRef
  title: string
  /** «Fase 1 · Bases técnicas» o «Proyecto · Fase 1». */
  context: string
}

export function studyTargets(phases: readonly Phase[]): StudyTarget[] {
  return phases.flatMap((phase) => [
    ...phase.topics.map((topic): StudyTarget => ({
      key: `tema:${topic.id}`,
      kind: 'topic',
      ref: { topicId: topic.id, projectPhaseId: null },
      title: topic.title,
      context: `${phaseLabel(phase)} · ${phase.title}`,
    })),
    {
      key: `proyecto:${phase.id}`,
      kind: 'project',
      ref: { topicId: null, projectPhaseId: phase.id },
      title: phase.project.title,
      context: `Proyecto · ${phaseLabel(phase)}`,
    },
  ])
}

export function targetKeyOf(ref: {
  topicId: string | null
  projectPhaseId: string | null
}): string {
  return ref.topicId ? `tema:${ref.topicId}` : `proyecto:${ref.projectPhaseId ?? ''}`
}

/** Minúsculas y sin tildes: «automatización» encuentra «Automatizacion». */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Busca por nombre: todas las palabras deben aparecer en el título (o en la fase). */
export function searchTargets(
  targets: readonly StudyTarget[],
  query: string,
  limit = 8,
): StudyTarget[] {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const matches = targets.filter((target) => {
    const haystack = fold(`${target.title} ${target.context}`)
    return words.every((word) => haystack.includes(word))
  })
  // Primero los que coinciden en el título.
  const inTitle = matches.filter((target) =>
    words.every((word) => fold(target.title).includes(word)),
  )
  const rest = matches.filter((target) => !inTitle.includes(target))
  return [...inTitle, ...rest].slice(0, limit)
}

/** Título del tema o proyecto al que apunta un temporizador o una sesión. */
export function targetTitle(
  phases: readonly Phase[],
  ref: { topicId: string | null; projectPhaseId: string | null },
): string | undefined {
  for (const phase of phases) {
    if (ref.projectPhaseId === phase.id) return phase.project.title
    const topic = phase.topics.find((candidate) => candidate.id === ref.topicId)
    if (topic) return topic.title
  }
  return undefined
}
