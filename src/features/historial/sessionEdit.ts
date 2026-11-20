import {
  parseManualSession,
  type ManualSessionInput,
  type ManualSessionResult,
} from '@/features/temporizador/manualSession'
import { toDateInputValue, toTimeInputValue } from '@/lib/dates'
import type { StudySession } from './sessionsApi'

const ms = (iso: string) => new Date(iso).getTime()

/**
 * Valida la edición de una sesión. Igual que una sesión manual, pero:
 * - conserva la duración total (con descansos y pausas) si es mayor que los minutos netos;
 * - si no cambiaste la fecha ni la hora, conserva el inicio y el fin exactos (con segundos).
 */
export function parseSessionEdit(
  input: ManualSessionInput,
  original: Pick<StudySession, 'startedAt' | 'endedAt'>,
  now: Date,
): ManualSessionResult {
  const spanMs = ms(original.endedAt) - ms(original.startedAt)
  const parsed = parseManualSession(input, now, spanMs)
  const sameStart =
    input.date === toDateInputValue(original.startedAt) &&
    input.time === toTimeInputValue(original.startedAt)
  if (!parsed.ok || !sameStart) return parsed
  const end = Math.max(
    ms(original.endedAt),
    ms(original.startedAt) + parsed.durationMinutes * 60_000,
  )
  return { ...parsed, startedAt: original.startedAt, endedAt: new Date(end).toISOString() }
}
