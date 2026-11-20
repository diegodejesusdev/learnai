import { describe, expect, it } from 'vitest'
import { toDayKey } from './dates'
import {
  computeStreaks,
  currentWeekMinutes,
  firstOfRecentWeeks,
  formatDays,
  minutesOnDay,
  recentWeeks,
  streakHint,
  type DayTotal,
} from './studyStats'

/** Días con minutos: { '2026-11-18': 30, … } → filas como las de study_day_totals. */
function days(minutesByDay: Record<string, number>): DayTotal[] {
  return Object.entries(minutesByDay).map(([day, minutes]) => ({ day, minutes, sessions: 1 }))
}

const TODAY = '2026-11-20' // viernes

describe('racha actual', () => {
  it('sin sesiones no hay racha', () => {
    expect(computeStreaks([], TODAY, 15)).toEqual({ current: 0, max: 0, todayCounts: false })
  })

  it('cuenta los días seguidos hasta hoy', () => {
    const history = days({ '2026-11-18': 20, '2026-11-19': 45, '2026-11-20': 15 })
    expect(computeStreaks(history, TODAY, 15)).toEqual({ current: 3, max: 3, todayCounts: true })
  })

  it('si hoy aún no estudiaste, la racha sigue viva y cuenta hasta ayer', () => {
    const history = days({ '2026-11-18': 20, '2026-11-19': 45 })
    expect(computeStreaks(history, TODAY, 15)).toMatchObject({ current: 2, todayCounts: false })
  })

  it('un día sin estudio rompe la racha', () => {
    // El 17 no hay nada: la racha actual empieza el 18.
    const history = days({ '2026-11-15': 30, '2026-11-16': 30, '2026-11-18': 30, '2026-11-19': 30 })
    expect(computeStreaks(history, TODAY, 15)).toMatchObject({ current: 2, max: 2 })
  })

  it('si ni hoy ni ayer cumplen, la racha actual es 0', () => {
    const history = days({ '2026-11-17': 60, '2026-11-18': 60 })
    expect(computeStreaks(history, TODAY, 15)).toMatchObject({ current: 0, max: 2 })
  })

  it('un día por debajo del mínimo no cuenta y también rompe la racha', () => {
    const history = days({ '2026-11-18': 30, '2026-11-19': 10, '2026-11-20': 30 })
    expect(computeStreaks(history, TODAY, 15)).toMatchObject({ current: 1, max: 1 })
  })

  it('el mínimo es configurable', () => {
    const history = days({ '2026-11-18': 30, '2026-11-19': 10, '2026-11-20': 30 })
    expect(computeStreaks(history, TODAY, 10)).toMatchObject({ current: 3 })
    expect(computeStreaks(history, TODAY, 31)).toMatchObject({ current: 0, max: 0 })
  })

  it('una sesión que cruza la medianoche cuenta en el día en que empezó', () => {
    // Martes 17, 23:40 → miércoles 18, 00:25 (Bogotá). En UTC empieza el 18 a las 04:40.
    const startDay = toDayKey('2026-11-18T04:40:00Z')
    expect(startDay).toBe('2026-11-17')
    // La base agrupa por ese día: los 45 min son del 17 y el 18 queda vacío.
    const history = days({ '2026-11-16': 20, [startDay]: 45 })
    expect(computeStreaks(history, '2026-11-18', 15)).toMatchObject({
      current: 2,
      todayCounts: false,
    })
    // El jueves 19 ya pasó un día entero (el 18) sin estudio: la racha se rompió.
    expect(computeStreaks(history, '2026-11-19', 15)).toMatchObject({ current: 0, max: 2 })
  })

  it('la racha sigue de domingo a lunes: el cambio de semana no la reinicia', () => {
    const history = days({ '2026-11-14': 20, '2026-11-15': 20, '2026-11-16': 20 }) // sáb, dom, lun
    expect(computeStreaks(history, '2026-11-16', 15)).toMatchObject({ current: 3 })
  })

  it('la racha cruza el cambio de mes y de año', () => {
    const history = days({ '2026-12-30': 20, '2026-12-31': 20, '2027-01-01': 20 })
    expect(computeStreaks(history, '2027-01-01', 15)).toMatchObject({ current: 3, max: 3 })
  })
})

describe('racha máxima', () => {
  it('es la más larga de la historia aunque la actual sea más corta', () => {
    const history = days({
      '2026-10-01': 30,
      '2026-10-02': 30,
      '2026-10-03': 30,
      '2026-10-04': 30,
      '2026-11-19': 30,
      '2026-11-20': 30,
    })
    expect(computeStreaks(history, TODAY, 15)).toMatchObject({ current: 2, max: 4 })
  })

  it('ignora días posteriores a hoy (reloj del dispositivo adelantado)', () => {
    const history = days({ '2026-11-20': 30, '2026-11-21': 30 })
    expect(computeStreaks(history, TODAY, 15)).toMatchObject({ current: 1, max: 1 })
  })
})

describe('semanas', () => {
  const weeks = [
    { weekStart: '2026-11-09', minutes: 120, sessions: 3 },
    { weekStart: '2026-11-16', minutes: 300, sessions: 6 },
  ]

  it('las últimas 12 semanas terminan en la actual y rellenan con 0', () => {
    const bars = recentWeeks(weeks, TODAY, 12)
    expect(bars).toHaveLength(12)
    expect(bars[0]?.weekStart).toBe('2026-08-31')
    expect(bars.at(-2)).toMatchObject({ weekStart: '2026-11-09', minutes: 120, isCurrent: false })
    expect(bars.at(-1)).toMatchObject({ weekStart: '2026-11-16', minutes: 300, isCurrent: true })
    expect(bars[5]).toMatchObject({ minutes: 0, sessions: 0 })
    expect(firstOfRecentWeeks(TODAY, 12)).toBe('2026-08-31')
  })

  it('el lunes empieza una semana nueva: lo del domingo queda en la anterior', () => {
    expect(currentWeekMinutes(weeks, '2026-11-22')).toBe(300) // domingo
    expect(currentWeekMinutes(weeks, '2026-11-23')).toBe(0) // lunes
  })

  it('una semana que cruza el cambio de mes se agrupa por su lunes', () => {
    const december = [{ weekStart: '2026-11-30', minutes: 90, sessions: 2 }]
    expect(currentWeekMinutes(december, '2026-12-03')).toBe(90)
  })
})

describe('otros', () => {
  it('minutos de un día y textos', () => {
    expect(minutesOnDay(days({ '2026-11-20': 25 }), TODAY)).toBe(25)
    expect(minutesOnDay([], TODAY)).toBe(0)
    expect(formatDays(1)).toBe('1 día')
    expect(formatDays(0)).toBe('0 días')
  })
})

describe('streakHint', () => {
  it('dice cuánto falta hoy para seguir o empezar la racha', () => {
    expect(streakHint({ current: 3, max: 3, todayCounts: true }, 20, 15)).toBe('Hoy ya cuenta.')
    expect(streakHint({ current: 2, max: 4, todayCounts: false }, 5, 15)).toBe(
      'Te faltan 10 min hoy para seguirla.',
    )
    expect(streakHint({ current: 0, max: 4, todayCounts: false }, 0, 15)).toBe(
      'Estudia 15 min hoy para empezar una.',
    )
  })
})
