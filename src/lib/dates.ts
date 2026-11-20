import { TZDate, tz } from '@date-fns/tz'
import { endOfWeek, format, startOfDay, startOfWeek } from 'date-fns'
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

/** 00:00 (Bogotá) del día del instante dado. */
export function startOfDayInZone(input: DateInput): Date {
  return new Date(startOfDay(toDate(input), { in: inAppZone }).getTime())
}

/** Valor para <input type="date"> en hora de Bogotá: 'yyyy-MM-dd'. */
export function toDateInputValue(input: DateInput): string {
  return toDayKey(input)
}

/** Valor para <input type="time"> en hora de Bogotá: 'HH:mm'. */
export function toTimeInputValue(input: DateInput): string {
  return format(toDate(input), 'HH:mm', { in: inAppZone })
}

/**
 * Fecha 'yyyy-MM-dd' y hora 'HH:mm' escritas en hora de Bogotá → instante real.
 * No depende de la zona horaria del dispositivo. null si el formato no es válido.
 */
export function zonedInputToDate(date: string, time: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time)
  if (!dateMatch || !timeMatch) return null
  const [year, month, day] = dateMatch.slice(1).map(Number) as [number, number, number]
  const [hours, minutes] = timeMatch.slice(1).map(Number) as [number, number]
  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59) return null
  const zoned = new TZDate(year, month - 1, day, hours, minutes, APP_TIME_ZONE)
  // 31 de febrero y similares: JavaScript los «corre» al mes siguiente; se rechazan.
  if (zoned.getDate() !== day) return null
  return new Date(zoned.getTime())
}

/** Segundos como reloj: '04:59' o, desde una hora, '1:02:03'. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}
