import { findPhaseIn, findTopicIn, type TopicWithPhase } from '@/lib/roadmap'
import type { Curriculum, Phase } from '@/types/curriculum'
import data from './curriculum.json'

// Copia de /curriculum.json. Las secciones leen la ruta de Supabase; solo el Tutor (hasta la
// fase 6) y los tests usan este archivo.
// Un test verifica que esta copia y la de la raíz sigan idénticas.
export const curriculum: Curriculum = data

export const phases: readonly Phase[] = [...curriculum.phases].sort((a, b) => a.order - b.order)

export const allTopics: readonly TopicWithPhase[] = phases.flatMap((phase) =>
  phase.topics.map((topic) => ({ topic, phase })),
)

export function findPhase(phaseId: string | undefined): Phase | undefined {
  return findPhaseIn(phases, phaseId)
}

export function findTopic(topicId: string | undefined): TopicWithPhase | undefined {
  return findTopicIn(phases, topicId)
}

export { phaseLabel } from '@/lib/roadmap'
