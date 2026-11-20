import { describe, expect, it } from 'vitest'
import { bogotaMondayKey, startOfBogotaDay } from './bogota.ts'
import { dailyLimitFrom, dailyLimitMessage, errorCodeFromStatus } from './tutorErrors.ts'

describe('errores del proveedor', () => {
  it('traduce el status HTTP a un código', () => {
    expect(errorCodeFromStatus(429)).toBe('rate_limit')
    expect(errorCodeFromStatus(401)).toBe('auth')
    expect(errorCodeFromStatus(403)).toBe('auth')
    expect(errorCodeFromStatus(504)).toBe('timeout')
    expect(errorCodeFromStatus(529)).toBe('unavailable')
    expect(errorCodeFromStatus(503)).toBe('unavailable')
    expect(errorCodeFromStatus(400)).toBe('bad_request')
  })
})

describe('límite diario', () => {
  it('50 por defecto; TUTOR_DAILY_LIMIT lo cambia si es un entero positivo', () => {
    expect(dailyLimitFrom(undefined)).toBe(50)
    expect(dailyLimitFrom('')).toBe(50)
    expect(dailyLimitFrom('0')).toBe(50)
    expect(dailyLimitFrom('2.5')).toBe(50)
    expect(dailyLimitFrom('20')).toBe(20)
    expect(dailyLimitMessage(20)).toContain('límite de 20 mensajes')
  })

  it('el día empieza a las 00:00 de Bogotá (05:00 UTC)', () => {
    expect(startOfBogotaDay(new Date('2026-11-20T04:59:00Z')).toISOString()).toBe(
      '2026-11-19T05:00:00.000Z',
    )
    expect(startOfBogotaDay(new Date('2026-11-20T05:00:00Z')).toISOString()).toBe(
      '2026-11-20T05:00:00.000Z',
    )
    expect(startOfBogotaDay(new Date('2026-11-20T23:30:00Z')).toISOString()).toBe(
      '2026-11-20T05:00:00.000Z',
    )
  })

  it('el lunes de la semana en Bogotá', () => {
    expect(bogotaMondayKey(new Date('2026-11-20T15:00:00Z'))).toBe('2026-11-16') // viernes
    // Domingo 22 a las 11:30 p. m. en Bogotá (lunes 23 en UTC): sigue en la semana del 16.
    expect(bogotaMondayKey(new Date('2026-11-23T04:30:00Z'))).toBe('2026-11-16')
    expect(bogotaMondayKey(new Date('2026-11-23T05:00:00Z'))).toBe('2026-11-23')
  })
})
