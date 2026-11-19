import { tz } from '@date-fns/tz'
import { endOfWeek, format, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

// Único lugar donde se decide la zona horaria de la app (ver CLAUDE.md).
export const APP_TIME_ZONE = 'America/Bogota'

const inAppZone = tz(APP_TIME_ZONE)

export type DateInput = Date | string | number

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input)
}

/** Día calendario en Bogotá, como 'yyyy-MM-dd'. Sirve de clave para agrupar por día. */
export function toDayKey(input: DateInput): string {
  return format(toDate(input), 'yyyy-MM-dd', { in: inAppZone })
}

/** Lunes 00:00 (Bogotá) de la semana del instante dado. */
export function startOfWeekInZone(input: DateInput): Date {
  return new Date(startOfWeek(toDate(input), { weekStartsOn: 1, in: inAppZone }).getTime())
}

/** Domingo 23:59:59.999 (Bogotá) de la semana del instante dado. */
export function endOfWeekInZone(input: DateInput): Date {
  return new Date(endOfWeek(toDate(input), { weekStartsOn: 1, in: inAppZone }).getTime())
}

/** Formatea en español y en hora de Bogotá con un patrón de date-fns. */
export function formatInZone(input: DateInput, pattern: string): string {
  return format(toDate(input), pattern, { in: inAppZone, locale: es })
}

/** Ej.: "Miércoles, 18 de noviembre". */
export function formatLongDate(input: DateInput): string {
  const text = formatInZone(input, "EEEE, d 'de' MMMM")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Ej.: "18 nov". */
export function formatShortDate(input: DateInput): string {
  return formatInZone(input, 'd MMM')
}

/** Ej.: "8:30 a.m.". */
export function formatTime(input: DateInput): string {
  return formatInZone(input, 'h:mm aaaa')
}

/** Minutos a texto: "45 min", "2 h", "5 h 20 min". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} h`
  return `${hours} h ${rest} min`
}
