import { describe, expect, it } from 'vitest'
import { createTimer, pause } from './timerModel'
import { timerView } from './timerView'

const start = new Date('2026-11-19T14:00:00.000Z')
const pomodoro = createTimer({
  mode: 'pomodoro',
  target: { topicId: 'f1-t5', projectPhaseId: null },
  workMin: 25,
  breakMin: 5,
  now: start,
})

describe('timerView', () => {
  it('Pomodoro muestra la cuenta regresiva del bloque', () => {
    const view = timerView(pomodoro, start.getTime() + 10 * 60_000)
    expect(view).toMatchObject({
      clock: '15:00',
      phaseLabel: 'Trabajo',
      paused: false,
      blockProgress: 0.4,
    })
  })

  it('en el descanso muestra lo que falta del descanso', () => {
    expect(timerView(pomodoro, start.getTime() + 27 * 60_000)).toMatchObject({
      clock: '03:00',
      phaseLabel: 'Descanso',
    })
  })

  it('libre cuenta hacia arriba y marca la pausa', () => {
    const free = pause(
      { ...pomodoro, mode: 'free' },
      new Date(start.getTime() + 65 * 60_000 + 7000),
    )
    expect(timerView(free, start.getTime() + 90 * 60_000)).toMatchObject({
      clock: '1:05:07',
      phaseLabel: 'Libre',
      paused: true,
    })
  })
})
