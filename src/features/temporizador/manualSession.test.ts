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

describe('editar una sesión', () => {
  it('conserva la duración total con descansos si es mayor que los minutos netos', () => {
    // Pomodoro de 40 min en total (35 netos + 5 de descanso), movido a las 9:00.
    const result = parseManualSession(
      { date: '2026-11-19', time: '09:00', durationMinutes: '35' },
      NOW,
      40 * 60_000,
    )
    expect(result).toMatchObject({
      ok: true,
      startedAt: '2026-11-19T14:00:00.000Z',
      endedAt: '2026-11-19T14:40:00.000Z',
    })
  })

  it('si los minutos netos crecen, el fin se corre', () => {
    const result = parseManualSession(
      { date: '2026-11-19', time: '09:00', durationMinutes: '50' },
      NOW,
      40 * 60_000,
    )
    expect(result).toMatchObject({ ok: true, endedAt: '2026-11-19T14:50:00.000Z' })
  })

  it('tampoco puede terminar en el futuro', () => {
    // Empieza a las 2:30 p. m. y duraba 40 min en total: terminaría a las 3:10 p. m.
    const result = parseManualSession(
      { date: '2026-11-19', time: '14:30', durationMinutes: '20' },
      NOW,
      40 * 60_000,
    )
    expect(result).toMatchObject({ ok: false, field: 'date' })
  })
})
