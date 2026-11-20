import {
  addDaysToKey,
  daysBetweenKeys,
  formatDayKey,
  formatDuration,
  startOfWeekKey,
  subtractMonthsFromKey,
} from '@/lib/dates'
import type { DayTotal } from '@/lib/studyStats'

/** 0 = sin estudio · 1 = no llega al mínimo de la racha · 2 a 4 = cada vez más minutos. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4

export interface HeatCell {
  day: string
  minutes: number
  level: HeatLevel
  /** Días de la semana actual que aún no llegan: no se dibujan. */
  future: boolean
}

/** Una columna del mapa: lunes a domingo. */
export interface HeatWeek {
  weekStart: string
  cells: HeatCell[]
  /** Nombre del mes en la columna donde empieza ('nov'), o null. */
  monthLabel: string | null
}

/** Desde cuántos minutos empieza cada nivel 2, 3 y 4. Con un mínimo alto, los niveles se corren. */
function levelThresholds(minMinutes: number): [number, number, number] {
  return [minMinutes, Math.max(minMinutes, 60), Math.max(minMinutes, 120)]
}

export function heatLevel(minutes: number, minMinutes: number): HeatLevel {
  if (minutes <= 0) return 0
  const [counts, hour, twoHours] = levelThresholds(minMinutes)
  if (minutes < counts) return 1
  if (minutes < hour) return 2
  if (minutes < twoHours) return 3
  return 4
}

/** Leyenda del mapa, sin los niveles que quedan vacíos con el mínimo elegido. */
export function heatLegend(minMinutes: number): { level: HeatLevel; label: string }[] {
  const [counts, hour, twoHours] = levelThresholds(minMinutes)
  const legend: { level: HeatLevel; label: string }[] = [
    { level: 0, label: 'Sin estudio' },
    { level: 1, label: `Menos de ${formatDuration(counts)}` },
  ]
  if (hour > counts) {
    legend.push({ level: 2, label: `${formatDuration(counts)} a ${formatDuration(hour - 1)}` })
  }
  if (twoHours > hour) {
    legend.push({ level: 3, label: `${formatDuration(hour)} a ${formatDuration(twoHours - 1)}` })
  }
  legend.push({ level: 4, label: `${formatDuration(twoHours)} o más` })
  return legend
}

/** Semanas completas (lunes a domingo) desde hace `months` meses hasta la semana de hoy. */
export function heatmapWeeks(
  days: readonly DayTotal[],
  today: string,
  months: number,
  minMinutes: number,
): HeatWeek[] {
  const minutesByDay = new Map(days.map((total) => [total.day, total.minutes]))
  const first = startOfWeekKey(subtractMonthsFromKey(today, months))
  const weekCount = daysBetweenKeys(first, startOfWeekKey(today)) / 7 + 1

  const weeks = Array.from({ length: weekCount }, (_, index): HeatWeek => {
    const weekStart = addDaysToKey(first, index * 7)
    const cells = Array.from({ length: 7 }, (_, weekday): HeatCell => {
      const day = addDaysToKey(weekStart, weekday)
      const minutes = minutesByDay.get(day) ?? 0
      return { day, minutes, level: heatLevel(minutes, minMinutes), future: day > today }
    })
    return { weekStart, cells, monthLabel: null }
  })

  // El nombre del mes va en la primera columna cuyo lunes ya es de ese mes.
  weeks.forEach((week, index) => {
    const previous = weeks[index - 1]
    if (!previous || previous.weekStart.slice(0, 7) !== week.weekStart.slice(0, 7)) {
      week.monthLabel = formatDayKey(week.weekStart, 'MMM')
    }
  })
  // Si el primer mes apenas asoma, su nombre se montaría sobre el siguiente.
  const [firstWeek, second, third] = weeks
  if (firstWeek && (second?.monthLabel || third?.monthLabel)) firstWeek.monthLabel = null
  return weeks
}

/** «miércoles 18 de noviembre: 45 min» (para lectores de pantalla y al pasar el ratón). */
export function cellLabel(day: string, minutes: number): string {
  const date = formatDayKey(day, "EEEE d 'de' MMMM")
  return `${date}: ${minutes > 0 ? formatDuration(minutes) : 'sin estudio'}`
}
