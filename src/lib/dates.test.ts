import { describe, expect, it } from 'vitest'
import {
  addDaysToKey,
  daysBetweenKeys,
  endOfWeekInZone,
  formatDayKey,
  formatRelativeDay,
  startOfWeekKey,
  subtractMonthsFromKey,
  weekdayOfKey,
  formatClock,
  startOfDayInZone,
  toDateInputValue,
  toTimeInputValue,
  zonedInputToDate,
  formatDuration,
  formatLongDate,
  formatTime,
  startOfWeekInZone,
  toDayKey,
} from './dates'

describe('toDayKey', () => {
  it('usa el día de Bogotá y no el de UTC: 23:50 COT = 04:50 UTC del día siguiente', () => {
    expect(toDayKey('2026-11-18T04:50:00Z')).toBe('2026-11-17')
  })

  it('cambia de día a la medianoche de Bogotá (05:00 UTC)', () => {
    expect(toDayKey('2026-11-18T04:59:59Z')).toBe('2026-11-17')
    expect(toDayKey('2026-11-18T05:00:00Z')).toBe('2026-11-18')
  })

  it('acepta Date y milisegundos', () => {
    const instant = new Date('2026-01-01T03:00:00Z') // 31 dic, 10:00 p. m. en Bogotá
    expect(toDayKey(instant)).toBe('2025-12-31')
    expect(toDayKey(instant.getTime())).toBe('2025-12-31')
  })
})

describe('semana de lunes a domingo en Bogotá', () => {
  it('el martes 17 nov a las 23:50 COT pertenece a la semana del lunes 16 nov', () => {
    expect(startOfWeekInZone('2026-11-18T04:50:00Z').toISOString()).toBe('2026-11-16T05:00:00.000Z')
  })

  it('el domingo 22 nov a las 23:30 COT sigue en la misma semana', () => {
    expect(startOfWeekInZone('2026-11-23T04:30:00Z').toISOString()).toBe('2026-11-16T05:00:00.000Z')
    expect(endOfWeekInZone('2026-11-23T04:30:00Z').toISOString()).toBe('2026-11-23T04:59:59.999Z')
  })

  it('una semana puede cruzar el cambio de mes', () => {
    expect(startOfWeekInZone('2026-12-02T15:00:00Z').toISOString()).toBe('2026-11-30T05:00:00.000Z')
  })
})

describe('formatos en español', () => {
  it('fecha larga con mayúscula inicial', () => {
    expect(formatLongDate('2026-11-18T15:00:00Z')).toBe('Miércoles, 18 de noviembre')
  })

  it('hora en Bogotá', () => {
    expect(formatTime('2026-11-18T13:30:00Z')).toBe('8:30 a.m.')
    expect(formatTime('2026-11-18T23:05:00Z')).toBe('6:05 p.m.')
  })

  it('duraciones', () => {
    expect(formatDuration(0)).toBe('0 min')
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(120)).toBe('2 h')
    expect(formatDuration(320)).toBe('5 h 20 min')
  })
})

describe('formularios en hora de Bogotá', () => {
  it('fecha y hora escritas en Bogotá → instante UTC (Bogotá es UTC-5)', () => {
    expect(zonedInputToDate('2026-11-17', '23:30')?.toISOString()).toBe('2026-11-18T04:30:00.000Z')
    expect(zonedInputToDate('2026-11-18', '00:00')?.toISOString()).toBe('2026-11-18T05:00:00.000Z')
  })

  it('rechaza fechas u horas inválidas', () => {
    expect(zonedInputToDate('2026-02-31', '10:00')).toBeNull()
    expect(zonedInputToDate('2026-11-18', '24:00')).toBeNull()
    expect(zonedInputToDate('18/11/2026', '10:00')).toBeNull()
  })

  it('valores por defecto de los inputs en Bogotá aunque en UTC ya sea otro día', () => {
    const instant = '2026-11-18T04:30:00Z' // 17 nov, 11:30 p. m. en Bogotá
    expect(toDateInputValue(instant)).toBe('2026-11-17')
    expect(toTimeInputValue(instant)).toBe('23:30')
  })

  it('inicio del día en Bogotá', () => {
    expect(startOfDayInZone('2026-11-18T04:30:00Z').toISOString()).toBe('2026-11-17T05:00:00.000Z')
  })
})

describe('formatClock', () => {
  it('minutos y segundos, y horas cuando hace falta', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(299)).toBe('04:59')
    expect(formatClock(3723)).toBe('1:02:03')
    expect(formatClock(-5)).toBe('00:00')
  })
})

describe('claves de día', () => {
  it('suma días cruzando meses y años', () => {
    expect(addDaysToKey('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('cuenta los días entre dos claves', () => {
    expect(daysBetweenKeys('2026-11-18', '2026-11-20')).toBe(2)
    expect(daysBetweenKeys('2026-11-20', '2026-11-18')).toBe(-2)
    expect(daysBetweenKeys('2026-12-31', '2027-01-01')).toBe(1)
  })

  it('semana de lunes a domingo, también cuando cruza el cambio de mes', () => {
    expect(weekdayOfKey('2026-11-16')).toBe(0) // lunes
    expect(weekdayOfKey('2026-11-22')).toBe(6) // domingo
    expect(startOfWeekKey('2026-11-22')).toBe('2026-11-16')
    expect(startOfWeekKey('2026-12-02')).toBe('2026-11-30')
  })

  it('resta meses y ajusta los días que no existen', () => {
    expect(subtractMonthsFromKey('2026-11-20', 6)).toBe('2026-05-20')
    expect(subtractMonthsFromKey('2026-08-31', 6)).toBe('2026-02-28')
    expect(subtractMonthsFromKey('2026-03-15', 6)).toBe('2025-09-15')
  })

  it('formatea y describe el día respecto a hoy', () => {
    expect(formatDayKey('2026-11-18', 'd MMM')).toBe('18 nov')
    expect(formatRelativeDay('2026-11-20', '2026-11-20')).toBe('hoy')
    expect(formatRelativeDay('2026-11-19', '2026-11-20')).toBe('ayer')
    expect(formatRelativeDay('2026-11-16', '2026-11-20')).toBe('hace 4 días')
    expect(formatRelativeDay('2026-11-01', '2026-11-20')).toBe('1 nov')
  })
})
