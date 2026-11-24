import { nextTopic } from '@/lib/progress'
import type { Track } from '@/lib/roadmap'
import type { StatusMap } from '@/types/progress'

/** Tema y proyecto por defecto de una ruta: los del siguiente tema sugerido. */
export function defaultTarget(
  track: Track,
  topicStatuses: StatusMap,
): { topicId: string; phaseId: string } {
  const suggestion = nextTopic(track.phases, topicStatuses)
  const [firstPhase] = track.phases
  return {
    topicId: suggestion?.topic.id ?? firstPhase?.topics[0]?.id ?? '',
    phaseId: suggestion?.phase.id ?? firstPhase?.id ?? '',
  }
}
