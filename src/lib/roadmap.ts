import type { Phase, Topic } from '@/types/curriculum'

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
