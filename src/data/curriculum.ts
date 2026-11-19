import { findPhaseIn, findTopicIn, type TopicWithPhase } from '@/lib/roadmap'
import type { Curriculum, Phase } from '@/types/curriculum'
import data from './curriculum.json'

// Copia de /curriculum.json. La sección Ruta ya lee de Supabase; Inicio, Estudiar, Historial y
// Tutor todavía usan este archivo hasta que se conecten en sus fases.
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
