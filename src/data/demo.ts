// Datos de ejemplo para la fase 1. Se eliminan cuando la app lea de Supabase (fases 2–5).
import type { StatusMap, StudyMode } from '@/types/progress'
import { phases } from './curriculum'

const firstPhaseDone = Object.fromEntries(
  phases[0]?.topics.map((topic) => [topic.id, 'hecho']) ?? [],
)

export const demoTopicStatuses: StatusMap = {
  ...firstPhaseDone,
  'f1-t1': 'hecho',
  'f1-t2': 'hecho',
  'f1-t3': 'hecho',
  'f1-t4': 'hecho',
  'f1-t5': 'en_curso',
  'f1-t6': 'en_curso',
}

export const demoProjectStatuses: StatusMap = {
  f0: 'hecho',
  f1: 'en_curso',
}

export const demoChecklistDone: readonly string[] = ['c1']

export const demoStats = {
  todayMinutes: 45,
  currentStreak: 4,
  maxStreak: 9,
  weekMinutes: 320,
  weeklyGoalMinutes: 600,
  lastTopicId: 'f1-t5',
}

export interface DemoSession {
  id: string
  topicId: string
  startedAt: string
  durationMinutes: number
  mode: StudyMode
}

export const demoSessions: readonly DemoSession[] = [
  {
    id: 's1',
    topicId: 'f1-t5',
    startedAt: '2026-11-18T13:30:00Z',
    durationMinutes: 45,
    mode: 'pomodoro',
  },
  {
    id: 's2',
    topicId: 'f1-t4',
    startedAt: '2026-11-17T23:10:00Z',
    durationMinutes: 60,
    mode: 'free',
  },
  {
    id: 's3',
    topicId: 'f1-t3',
    startedAt: '2026-11-16T14:00:00Z',
    durationMinutes: 75,
    mode: 'pomodoro',
  },
  {
    id: 's4',
    topicId: 'f0-t6',
    startedAt: '2026-11-15T15:00:00Z',
    durationMinutes: 50,
    mode: 'manual',
  },
  {
    id: 's5',
    topicId: 'f0-t8',
    startedAt: '2026-11-14T22:00:00Z',
    durationMinutes: 90,
    mode: 'pomodoro',
  },
]
