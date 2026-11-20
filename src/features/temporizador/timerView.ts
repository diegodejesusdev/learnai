import { formatClock } from '@/lib/dates'
import {
  activeSeconds,
  focusSeconds,
  pomodoroState,
  type ActiveTimer,
  type PomodoroState,
} from './timerModel'

export interface TimerView {
  /** Pomodoro: lo que falta del bloque. Libre: el tiempo transcurrido. */
  clock: string
  phaseLabel: 'Trabajo' | 'Descanso' | 'Libre'
  paused: boolean
  /** Avance del bloque actual entre 0 y 1 (solo Pomodoro). */
  blockProgress: number | null
  pomodoro: PomodoroState | null
  focusSeconds: number
}

/** Lo que se pinta en pantalla para un temporizador en un instante dado. */
export function timerView(timer: ActiveTimer, now: number): TimerView {
  const active = activeSeconds(timer, now)
  const base = { paused: timer.pausedAt !== null, focusSeconds: focusSeconds(timer, now) }
  if (timer.mode === 'free') {
    return {
      ...base,
      clock: formatClock(active),
      phaseLabel: 'Libre',
      blockProgress: null,
      pomodoro: null,
    }
  }
  const pomodoro = pomodoroState(active, timer.workMin, timer.breakMin)
  return {
    ...base,
    clock: formatClock(pomodoro.secondsLeft),
    phaseLabel: pomodoro.phase === 'work' ? 'Trabajo' : 'Descanso',
    blockProgress: pomodoro.secondsIntoBlock / pomodoro.blockSeconds,
    pomodoro,
  }
}
