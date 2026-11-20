import { describe, expect, it } from 'vitest'
import { toDayKey } from '@/lib/dates'
import {
  activeSeconds,
  createTimer,
  focusSeconds,
  pause,
  pomodoroState,
  resume,
  sessionDraft,
  type ActiveTimer,
} from './timerModel'

const START = '2026-11-19T14:00:00.000Z'
const at = (iso: string) => new Date(iso)
const t = (iso: string) => new Date(iso).getTime()

function timer(overrides: Partial<ActiveTimer> = {}): ActiveTimer {
  return {
    ...createTimer({
      mode: 'pomodoro',
      target: { topicId: 'f1-t5', projectPhaseId: null },
      workMin: 25,
      breakMin: 5,
      now: at(START),
    }),
    ...overrides,
  }
}

describe('tiempo activo desde la hora de inicio', () => {
  it('es la diferencia con la hora de inicio, no un contador', () => {
    expect(activeSeconds(timer(), t('2026-11-19T14:10:30.000Z'))).toBe(630)
  })

  it('en pausa queda congelado aunque pase el tiempo', () => {
    const paused = pause(timer(), at('2026-11-19T14:10:00.000Z'))
    expect(activeSeconds(paused, t('2026-11-19T14:10:00.000Z'))).toBe(600)
    expect(activeSeconds(paused, t('2026-11-19T18:00:00.000Z'))).toBe(600)
  })

  it('las pausas no cuentan: varias pausas y reanudaciones', () => {
    let state = timer()
    state = pause(state, at('2026-11-19T14:10:00.000Z')) // 10 min activos
    state = resume(state, at('2026-11-19T14:15:00.000Z')) // 5 min en pausa
    state = pause(state, at('2026-11-19T14:20:00.000Z')) // +5 min activos
    state = resume(state, at('2026-11-19T14:50:00.000Z')) // 30 min en pausa
    expect(state.pausedSeconds).toBe(35 * 60)
    expect(activeSeconds(state, t('2026-11-19T14:55:00.000Z'))).toBe(20 * 60)
  })

  it('pausar dos veces o reanudar sin pausa no cambia nada', () => {
    const paused = pause(timer(), at('2026-11-19T14:10:00.000Z'))
    expect(pause(paused, at('2026-11-19T14:20:00.000Z'))).toBe(paused)
    const running = timer()
    expect(resume(running, at('2026-11-19T14:20:00.000Z'))).toBe(running)
  })
})

describe('Pomodoro 25/5', () => {
  it('primer bloque de trabajo', () => {
    expect(pomodoroState(10 * 60, 25, 5)).toMatchObject({
      phase: 'work',
      cycle: 1,
      completedCycles: 0,
      blockIndex: 0,
      secondsLeft: 15 * 60,
    })
  })

  it('al llegar a 25:00 empieza el descanso y cuenta un ciclo completado', () => {
    expect(pomodoroState(25 * 60 - 1, 25, 5)).toMatchObject({
      phase: 'work',
      blockIndex: 0,
      secondsLeft: 1,
    })
    expect(pomodoroState(25 * 60, 25, 5)).toMatchObject({
      phase: 'break',
      completedCycles: 1,
      blockIndex: 1,
      secondsIntoBlock: 0,
      secondsLeft: 5 * 60,
    })
  })

  it('a los 30 min empieza el segundo ciclo', () => {
    expect(pomodoroState(30 * 60, 25, 5)).toMatchObject({
      phase: 'work',
      cycle: 2,
      completedCycles: 1,
      blockIndex: 2,
    })
  })

  it('el tiempo de estudio excluye descansos y pausas', () => {
    // 70 min activos = trabajo 25 + descanso 5 + trabajo 25 + descanso 5 + trabajo 10 → 60 min de estudio
    let state = timer()
    state = pause(state, at('2026-11-19T14:40:00.000Z'))
    state = resume(state, at('2026-11-19T15:00:00.000Z')) // 20 min de pausa
    expect(activeSeconds(state, t('2026-11-19T15:30:00.000Z'))).toBe(70 * 60)
    expect(focusSeconds(state, t('2026-11-19T15:30:00.000Z'))).toBe(60 * 60)
  })

  it('en modo libre todo el tiempo activo es estudio', () => {
    const free = timer({ mode: 'free' })
    expect(focusSeconds(free, t('2026-11-19T15:10:00.000Z'))).toBe(70 * 60)
  })
})

describe('al terminar', () => {
  it('propone la duración neta redondeada y termina en la pausa si está pausado', () => {
    const paused = pause(timer({ mode: 'free' }), at('2026-11-19T14:42:20.000Z'))
    const draft = sessionDraft(paused, t('2026-11-19T16:00:00.000Z'))
    expect(draft).toEqual({
      endedAt: '2026-11-19T14:42:20.000Z',
      focusSeconds: 42 * 60 + 20,
      durationMinutes: 42,
      maxMinutes: 43,
      tooShort: false,
    })
  })

  it('menos de un minuto se marca para descartar', () => {
    expect(sessionDraft(timer(), t('2026-11-19T14:00:59.000Z')).tooShort).toBe(true)
    expect(sessionDraft(timer(), t('2026-11-19T14:01:00.000Z')).tooShort).toBe(false)
  })

  it('si se olvidó corriendo más de 12 h, la duración se limita a 720 min', () => {
    const draft = sessionDraft(timer({ mode: 'free' }), t('2026-11-20T05:00:00.000Z'))
    expect(draft.durationMinutes).toBe(720)
    expect(draft.maxMinutes).toBe(720)
  })
})

describe('cambio de día en hora de Colombia', () => {
  // 23:50 del 17 nov en Bogotá = 04:50 UTC del 18 nov.
  const lateNight = timer({ mode: 'free', startedAt: '2026-11-18T04:50:00.000Z' })

  it('una sesión que cruza la medianoche de Bogotá cuenta en el día en que empezó', () => {
    const draft = sessionDraft(lateNight, t('2026-11-18T05:30:00.000Z')) // 00:30 del 18 en Bogotá
    expect(draft.durationMinutes).toBe(40)
    expect(toDayKey(lateNight.startedAt)).toBe('2026-11-17')
    expect(toDayKey(draft.endedAt)).toBe('2026-11-18')
  })

  it('con una pausa justo en la medianoche el tiempo sigue siendo correcto', () => {
    let state = pause(lateNight, at('2026-11-18T05:00:00.000Z')) // 10 min, pausa a las 00:00
    state = resume(state, at('2026-11-18T05:15:00.000Z'))
    expect(activeSeconds(state, t('2026-11-18T05:30:00.000Z'))).toBe(25 * 60)
  })
})
