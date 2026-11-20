import { describe, expect, it } from 'vitest'
import { parseSessionEdit } from './sessionEdit'

const NOW = new Date('2026-11-20T20:00:00Z') // 3:00 p. m. en Bogotá
// Pomodoro del 18 nov de 8:00:27 a 8:40:27 a. m. (Bogotá): 40 min en total, 35 netos.
const original = { startedAt: '2026-11-18T13:00:27.000Z', endedAt: '2026-11-18T13:40:27.000Z' }

describe('editar una sesión', () => {
  it('si solo cambian los minutos, conserva el inicio y el fin exactos', () => {
    expect(
      parseSessionEdit({ date: '2026-11-18', time: '08:00', durationMinutes: '30' }, original, NOW),
    ).toEqual({ ok: true, ...original, durationMinutes: 30 })
  })

  it('si los minutos pasan la duración total, el fin se corre', () => {
    const result = parseSessionEdit(
      { date: '2026-11-18', time: '08:00', durationMinutes: '50' },
      original,
      NOW,
    )
    expect(result).toMatchObject({
      ok: true,
      startedAt: original.startedAt,
      endedAt: '2026-11-18T13:50:27.000Z',
    })
  })

  it('al mover la hora (en Bogotá), conserva los 40 min de duración total', () => {
    const result = parseSessionEdit(
      { date: '2026-11-17', time: '23:30', durationMinutes: '35' },
      original,
      NOW,
    )
    expect(result).toEqual({
      ok: true,
      startedAt: '2026-11-18T04:30:00.000Z',
      endedAt: '2026-11-18T05:10:00.000Z',
      durationMinutes: 35,
    })
  })

  it('valida como una sesión manual', () => {
    expect(
      parseSessionEdit({ date: '2026-11-18', time: '08:00', durationMinutes: '0' }, original, NOW),
    ).toMatchObject({ ok: false, field: 'duration' })
    expect(
      parseSessionEdit({ date: '2026-11-21', time: '08:00', durationMinutes: '30' }, original, NOW),
    ).toMatchObject({ ok: false, field: 'date' })
  })
})
