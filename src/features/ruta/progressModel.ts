import type { ProgressStatus, StatusMap } from '@/types/progress'
import type {
  ChecklistProgress,
  ProgressSnapshot,
  ProjectPatch,
  ProjectProgress,
  TopicProgress,
} from './progressApi'

// Funciones puras para leer el snapshot y aplicar cambios optimistas sobre la caché.
// Imitan lo que hacen los triggers de la base (completed_at, done_at).

export const emptySnapshot: ProgressSnapshot = { topics: {}, projects: {}, checklist: {} }

const emptyTopic: TopicProgress = { status: 'pendiente', notes: '', completed_at: null }
const emptyProject: ProjectProgress = {
  status: 'pendiente',
  repo_url: null,
  demo_url: null,
  notes: '',
  completed_at: null,
}

export function topicProgressOf(snapshot: ProgressSnapshot, topicId: string): TopicProgress {
  return snapshot.topics[topicId] ?? emptyTopic
}

export function projectProgressOf(snapshot: ProgressSnapshot, phaseId: string): ProjectProgress {
  return snapshot.projects[phaseId] ?? emptyProject
}

export function checklistDone(
  snapshot: ProgressSnapshot,
  itemId: string,
): ChecklistProgress | undefined {
  const item = snapshot.checklist[itemId]
  return item?.done ? item : undefined
}

function statusesOf(rows: ProgressSnapshot['topics'] | ProgressSnapshot['projects']): StatusMap {
  const map: Partial<Record<string, ProgressStatus>> = {}
  for (const [id, row] of Object.entries(rows)) if (row) map[id] = row.status
  return map
}

export function topicStatuses(snapshot: ProgressSnapshot): StatusMap {
  return statusesOf(snapshot.topics)
}

export function projectStatuses(snapshot: ProgressSnapshot): StatusMap {
  return statusesOf(snapshot.projects)
}

/** Cuántos de esos ítems (los de una ruta) están logrados. */
export function checklistDoneCount(
  snapshot: ProgressSnapshot,
  items: readonly { id: string }[],
): number {
  return items.filter((item) => snapshot.checklist[item.id]?.done).length
}

function completedAt(status: ProgressStatus, previous: string | null, now: string): string | null {
  return status === 'hecho' ? (previous ?? now) : null
}

export function withTopicStatus(
  snapshot: ProgressSnapshot,
  topicId: string,
  status: ProgressStatus,
  now: string,
): ProgressSnapshot {
  const current = topicProgressOf(snapshot, topicId)
  return {
    ...snapshot,
    topics: {
      ...snapshot.topics,
      [topicId]: {
        ...current,
        status,
        completed_at: completedAt(status, current.completed_at, now),
      },
    },
  }
}

export function withTopicNotes(
  snapshot: ProgressSnapshot,
  topicId: string,
  notes: string,
): ProgressSnapshot {
  return {
    ...snapshot,
    topics: { ...snapshot.topics, [topicId]: { ...topicProgressOf(snapshot, topicId), notes } },
  }
}

export function withProject(
  snapshot: ProgressSnapshot,
  phaseId: string,
  patch: ProjectPatch,
  now: string,
): ProgressSnapshot {
  const current = projectProgressOf(snapshot, phaseId)
  const next = { ...current, ...patch }
  return {
    ...snapshot,
    projects: {
      ...snapshot.projects,
      [phaseId]: { ...next, completed_at: completedAt(next.status, current.completed_at, now) },
    },
  }
}

export function withChecklistItem(
  snapshot: ProgressSnapshot,
  itemId: string,
  done: boolean,
  now: string,
): ProgressSnapshot {
  const previous = snapshot.checklist[itemId]?.done_at ?? null
  return {
    ...snapshot,
    checklist: {
      ...snapshot.checklist,
      [itemId]: { done, done_at: done ? (previous ?? now) : null },
    },
  }
}
