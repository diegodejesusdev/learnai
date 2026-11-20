// Días de Bogotá en la Edge Function (en la app se usa src/lib/dates.ts).
// Colombia está en UTC−5 todo el año (sin horario de verano), así que basta restar 5 horas.

const OFFSET_MS = 5 * 3_600_000

/** 00:00 de hoy en Bogotá, como instante. */
export function startOfBogotaDay(now: Date): Date {
  const bogota = new Date(now.getTime() - OFFSET_MS)
  return new Date(
    Date.UTC(bogota.getUTCFullYear(), bogota.getUTCMonth(), bogota.getUTCDate()) + OFFSET_MS,
  )
}

/** Lunes de la semana actual en Bogotá, como 'yyyy-MM-dd' (para study_week_totals). */
export function bogotaMondayKey(now: Date): string {
  const bogota = new Date(now.getTime() - OFFSET_MS)
  const daysSinceMonday = (bogota.getUTCDay() + 6) % 7
  bogota.setUTCDate(bogota.getUTCDate() - daysSinceMonday)
  return bogota.toISOString().slice(0, 10)
}
