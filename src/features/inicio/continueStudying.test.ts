import { describe, expect, it } from 'vitest'
import { phases } from '@/data/curriculum'
import type { StudySession } from '@/features/historial/sessionsApi'
import { createTimer } from '@/features/temporizador/timerModel'
import { continueSuggestion } from './continueStudying'

const latest: StudySession = {
  id: 's1',
  target: { topicId: 'f1-t5', projectPhaseId: null },
  startedAt: '2026-11-19T13:00:00Z',
  endedAt: '2026-11-19T13:45:00Z',
  durationMinutes: 45,
  mode: 'pomodoro',
  notes: '',
}

const base = { phases, topicStatuses: {}, projectStatuses: {} }

describe('Seguir estudiando', () => {
  it('con una sesión en curso, vuelve al temporizador', () => {
    const timer = createTimer({
      mode: 'free',
      target: { topicId: null, projectPhaseId: 'f2' },
      workMin: 25,
      breakMin: 5,
      now: new Date(),
    })
    expect(continueSuggestion({ ...base, timer, latest })).toMatchObject({
      kind: 'timer',
      target: { projectPhaseId: 'f2' },
      to: '/estudiar',
    })
  })

  it('si no, retoma el tema de la última sesión', () => {
    expect(continueSuggestion({ ...base, timer: null, latest })).toEqual({
      kind: 'last',
      target: latest.target,
      to: '/estudiar?tema=f1-t5',
      lastStartedAt: latest.startedAt,
    })
  })

  it('el proyecto de la última sesión abre Estudiar con ese proyecto', () => {
    const project = { ...latest, target: { topicId: null, projectPhaseId: 'f3' } }
    expect(continueSuggestion({ ...base, timer: null, latest: project })?.to).toBe(
      '/estudiar?proyecto=f3',
    )
  })

  it('si la última sesión ya está hecha, propone el siguiente tema de la ruta', () => {
    const suggestion = continueSuggestion({
      ...base,
      topicStatuses: { 'f1-t5': 'hecho' },
      timer: null,
      latest,
    })
    expect(suggestion).toMatchObject({ kind: 'next', to: '/estudiar?tema=f0-t1' })
  })

  it('sin sesiones, también el siguiente tema; con todo hecho, nada', () => {
    expect(continueSuggestion({ ...base, timer: null, latest: null })?.kind).toBe('next')
    const allDone = Object.fromEntries(
      phases.flatMap((phase) => phase.topics.map((topic) => [topic.id, 'hecho' as const])),
    )
    expect(
      continueSuggestion({ ...base, topicStatuses: allDone, timer: null, latest: null }),
    ).toBeNull()
  })
})
