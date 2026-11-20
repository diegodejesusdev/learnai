import { zonedInputToDate } from '@/lib/dates'

export interface ManualSessionInput {
  date: string
  time: string
  durationMinutes: string
}

export type ManualSessionResult =
  | { ok: true; startedAt: string; endedAt: string; durationMinutes: number }
  | { ok: false; field: 'date' | 'duration'; error: string }

/** Valida el formulario de sesión manual (fecha y hora en Bogotá) y calcula inicio y fin. */
export function parseManualSession(input: ManualSessionInput, now: Date): ManualSessionResult {
  const duration = Number(input.durationMinutes)
  if (!Number.isInteger(duration) || duration < 1 || duration > 720) {
    return { ok: false, field: 'duration', error: 'La duración debe estar entre 1 y 720 minutos.' }
  }
  const start = zonedInputToDate(input.date, input.time)
  if (!start) return { ok: false, field: 'date', error: 'Revisa la fecha y la hora.' }
  const end = new Date(start.getTime() + duration * 60_000)
  // Un minuto de margen por si el reloj del dispositivo va un poco adelantado.
  if (end.getTime() > now.getTime() + 60_000) {
    return { ok: false, field: 'date', error: 'La sesión no puede terminar en el futuro.' }
  }
  return {
    ok: true,
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    durationMinutes: duration,
  }
}
