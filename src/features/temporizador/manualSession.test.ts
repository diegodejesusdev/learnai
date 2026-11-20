import { describe, expect, it } from 'vitest'
import { toDayKey } from '@/lib/dates'
import { parseManualSession } from './manualSession'

const NOW = new Date('2026-11-19T20:00:00.000Z') // 3:00 p. m. en Bogotá

describe('sesión manual', () => {
  it('la hora escrita es hora de Bogotá', () => {
    expect(
      parseManualSession({ date: '2026-11-19', time: '08:30', durationMinutes: '45' }, NOW),
    ).toEqual({
      ok: true,
      startedAt: '2026-11-19T13:30:00.000Z',
      endedAt: '2026-11-19T14:15:00.000Z',
      durationMinutes: 45,
    })
  })

  it('cruza la medianoche de Bogotá y cuenta en el día en que empezó', () => {
    const result = parseManualSession(
      { date: '2026-11-17', time: '23:30', durationMinutes: '60' },
      NOW,
    )
    if (!result.ok) throw new Error(result.error)
    expect(result.startedAt).toBe('2026-11-18T04:30:00.000Z')
    expect(toDayKey(result.startedAt)).toBe('2026-11-17')
    expect(toDayKey(result.endedAt)).toBe('2026-11-18')
  })

  it('valida la duración', () => {
    expect(
      parseManualSession({ date: '2026-11-19', time: '08:00', durationMinutes: '0' }, NOW),
    ).toMatchObject({
      ok: false,
      field: 'duration',
    })
    expect(
      parseManualSession({ date: '2026-11-19', time: '08:00', durationMinutes: '12.5' }, NOW),
    ).toMatchObject({
      ok: false,
    })
  })

  it('no acepta sesiones que terminan en el futuro', () => {
    expect(
      parseManualSession({ date: '2026-11-19', time: '14:45', durationMinutes: '30' }, NOW),
    ).toEqual({
      ok: false,
      field: 'date',
      error: 'La sesión no puede terminar en el futuro.',
    })
  })
})
