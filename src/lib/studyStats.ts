import { addDaysToKey, daysBetweenKeys, formatDuration, startOfWeekKey } from './dates'

// Cálculos sobre los totales que devuelve la base (study_day_totals y study_week_totals).
// Los días ya vienen agrupados en hora de Bogotá; aquí solo se cuentan y se ordenan.

/** Minutos de un día de Bogotá ('yyyy-MM-dd'). */
export interface DayTotal {
  day: string
  minutes: number
  sessions: number
}

/** Minutos de una semana; weekStart es su lunes ('yyyy-MM-dd'). */
export interface WeekTotal {
  weekStart: string
  minutes: number
  sessions: number
}

export interface Streaks {
  /** Días seguidos que cumplen el mínimo, terminando hoy (o ayer, si hoy aún no lo cumple). */
  current: number
  /** La racha más larga de toda la historia. */
  max: number
  /** Hoy ya cumple el mínimo. */
  todayCounts: boolean
}

/**
 * Rachas: un día cuenta si suma al menos `minMinutes`. La racha actual no se rompe hasta
 * que termina el día: si hoy todavía no llega al mínimo, se cuenta hasta ayer.
 */
export function computeStreaks(
  days: readonly DayTotal[],
  today: string,
  minMinutes: number,
): Streaks {
  const counted = new Set(
    days.filter((day) => day.minutes >= minMinutes && day.day <= today).map((day) => day.day),
  )

  let max = 0
  let run = 0
  let previous: string | null = null
  for (const day of [...counted].sort()) {
    run = previous !== null && daysBetweenKeys(previous, day) === 1 ? run + 1 : 1
    max = Math.max(max, run)
    previous = day
  }

  const todayCounts = counted.has(today)
  let current = 0
  let cursor = todayCounts ? today : addDaysToKey(today, -1)
  while (counted.has(cursor)) {
    current += 1
    cursor = addDaysToKey(cursor, -1)
  }
  return { current, max, todayCounts }
}

export function minutesOnDay(days: readonly DayTotal[], day: string): number {
  return days.find((total) => total.day === day)?.minutes ?? 0
}

/** Lunes de la primera de las últimas `count` semanas (la actual incluida). */
export function firstOfRecentWeeks(today: string, count: number): string {
  return addDaysToKey(startOfWeekKey(today), -7 * (count - 1))
}

export interface WeekBar extends WeekTotal {
  isCurrent: boolean
}

/** Las últimas `count` semanas, de la más antigua a la actual; las semanas sin estudio van en 0. */
export function recentWeeks(weeks: readonly WeekTotal[], today: string, count: number): WeekBar[] {
  const byStart = new Map(weeks.map((week) => [week.weekStart, week]))
  const first = firstOfRecentWeeks(today, count)
  return Array.from({ length: count }, (_, index) => {
    const weekStart = addDaysToKey(first, index * 7)
    const week = byStart.get(weekStart)
    return {
      weekStart,
      minutes: week?.minutes ?? 0,
      sessions: week?.sessions ?? 0,
      isCurrent: index === count - 1,
    }
  })
}

/** Minutos de la semana actual (lunes a domingo). */
export function currentWeekMinutes(weeks: readonly WeekTotal[], today: string): number {
  const monday = startOfWeekKey(today)
  return weeks.find((week) => week.weekStart === monday)?.minutes ?? 0
}

export function formatDays(count: number): string {
  return count === 1 ? '1 día' : `${count} días`
}

/** Qué falta hoy para la racha: «Hoy ya cuenta.» o «Te faltan 10 min hoy para seguirla.». */
export function streakHint(streaks: Streaks, todayMinutes: number, minMinutes: number): string {
  if (streaks.todayCounts) return 'Hoy ya cuenta.'
  const missing = formatDuration(minMinutes - todayMinutes)
  return streaks.current > 0
    ? `Te faltan ${missing} hoy para seguirla.`
    : `Estudia ${missing} hoy para empezar una.`
}
