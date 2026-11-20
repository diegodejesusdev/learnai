// Cálculo del temporizador a partir de lo guardado (inicio, pausas), nunca con un contador
// en memoria: así el tiempo es correcto tras recargar, bloquear el móvil o cambiar de equipo.

export type TimerMode = 'pomodoro' | 'free'

/** Lo mismo que la fila de active_timer (y la copia en localStorage). */
export interface ActiveTimer {
  mode: TimerMode
  topicId: string | null
  projectPhaseId: string | null
  startedAt: string
  /** Inicio de la pausa actual; null si está corriendo. */
  pausedAt: string | null
  /** Segundos acumulados en pausas ya terminadas. */
  pausedSeconds: number
  workMin: number
  breakMin: number
  updatedAt: string
}

export type StudyTargetRef =
  { topicId: string; projectPhaseId: null } | { topicId: null; projectPhaseId: string }

const ms = (iso: string) => new Date(iso).getTime()
const MAX_SESSION_MINUTES = 720

export function createTimer(options: {
  mode: TimerMode
  target: StudyTargetRef
  workMin: number
  breakMin: number
  now: Date
}): ActiveTimer {
  const iso = options.now.toISOString()
  return {
    mode: options.mode,
    ...options.target,
    startedAt: iso,
    pausedAt: null,
    pausedSeconds: 0,
    workMin: options.workMin,
    breakMin: options.breakMin,
    updatedAt: iso,
  }
}

/** Segundos activos: desde el inicio hasta ahora (o hasta la pausa actual), menos las pausas. */
export function activeSeconds(timer: ActiveTimer, now: number): number {
  const end = timer.pausedAt ? Math.min(ms(timer.pausedAt), now) : now
  return Math.max(0, Math.floor((end - ms(timer.startedAt)) / 1000) - timer.pausedSeconds)
}

export function pause(timer: ActiveTimer, now: Date): ActiveTimer {
  if (timer.pausedAt) return timer
  const iso = now.toISOString()
  return { ...timer, pausedAt: iso, updatedAt: iso }
}

export function resume(timer: ActiveTimer, now: Date): ActiveTimer {
  if (!timer.pausedAt) return timer
  const paused = Math.max(0, Math.round((now.getTime() - ms(timer.pausedAt)) / 1000))
  const iso = now.toISOString()
  return { ...timer, pausedAt: null, pausedSeconds: timer.pausedSeconds + paused, updatedAt: iso }
}

export interface PomodoroState {
  phase: 'work' | 'break'
  /** Ciclo actual (1, 2, 3…). Un ciclo = bloque de trabajo + descanso. */
  cycle: number
  /** Bloques de trabajo terminados. */
  completedCycles: number
  /** 0 = 1.er trabajo, 1 = 1.er descanso, 2 = 2.º trabajo… Sube al cambiar de bloque. */
  blockIndex: number
  secondsIntoBlock: number
  blockSeconds: number
  secondsLeft: number
}

export function pomodoroState(active: number, workMin: number, breakMin: number): PomodoroState {
  const work = workMin * 60
  const rest = breakMin * 60
  const cycleLength = work + rest
  const completedFull = Math.floor(active / cycleLength)
  const intoCycle = active % cycleLength
  const inWork = intoCycle < work
  const secondsIntoBlock = inWork ? intoCycle : intoCycle - work
  const blockSeconds = inWork ? work : rest
  return {
    phase: inWork ? 'work' : 'break',
    cycle: completedFull + 1,
    completedCycles: completedFull + (inWork ? 0 : 1),
    blockIndex: completedFull * 2 + (inWork ? 0 : 1),
    secondsIntoBlock,
    blockSeconds,
    secondsLeft: blockSeconds - secondsIntoBlock,
  }
}

/** Tiempo de estudio neto: en Pomodoro solo cuentan los bloques de trabajo. */
export function focusSeconds(timer: ActiveTimer, now: number): number {
  const active = activeSeconds(timer, now)
  if (timer.mode === 'free') return active
  const work = timer.workMin * 60
  const cycleLength = work + timer.breakMin * 60
  return Math.floor(active / cycleLength) * work + Math.min(active % cycleLength, work)
}

export interface SessionDraft {
  endedAt: string
  focusSeconds: number
  /** Duración propuesta en minutos (redondeada, mínimo 1). */
  durationMinutes: number
  /** Máximo permitido: los minutos transcurridos entre inicio y fin (y nunca más de 12 h). */
  maxMinutes: number
  /** Menos de 1 minuto de estudio: se ofrece descartar. */
  tooShort: boolean
}

/** Lo que se guardaría al terminar ahora (o en la pausa actual, si está en pausa). */
export function sessionDraft(timer: ActiveTimer, now: number): SessionDraft {
  const end = timer.pausedAt ? Math.min(ms(timer.pausedAt), now) : now
  const focus = focusSeconds(timer, end)
  const wallMinutes = Math.ceil((end - ms(timer.startedAt)) / 60_000)
  const maxMinutes = Math.max(1, Math.min(MAX_SESSION_MINUTES, wallMinutes))
  return {
    endedAt: new Date(end).toISOString(),
    focusSeconds: focus,
    durationMinutes: Math.min(maxMinutes, Math.max(1, Math.round(focus / 60))),
    maxMinutes,
    tooShort: focus < 60,
  }
}
