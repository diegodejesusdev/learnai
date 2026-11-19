import { describe, expect, it } from 'vitest'
import {
  endOfWeekInZone,
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
