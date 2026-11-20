import { afterEach, describe, expect, it } from 'vitest'
import { createTimer, pause, type ActiveTimer } from './timerModel'
import {
  clearStoredTimer,
  readStoredTimer,
  reconcileTimer,
  writeStoredTimer,
  type StoredTimer,
} from './timerStorage'

const base = createTimer({
  mode: 'free',
  target: { topicId: 'f1-t5', projectPhaseId: null },
  workMin: 25,
  breakMin: 5,
  now: new Date('2026-11-19T14:00:00.000Z'),
})
const pausedLater: ActiveTimer = pause(base, new Date('2026-11-19T14:30:00.000Z'))

const stored = (timer: ActiveTimer | null, synced: boolean, changedAt: string): StoredTimer => ({
  userId: 'u1',
  timer,
  synced,
  changedAt,
})

afterEach(() => clearStoredTimer())

describe('reconcileTimer', () => {
  it('sin cambios locales pendientes, gana Supabase', () => {
    expect(reconcileTimer(base, stored(pausedLater, true, pausedLater.updatedAt))).toEqual({
      timer: base,
      push: false,
    })
  })

  it('terminada en otro dispositivo: Supabase ya no tiene timer y la copia local (sincronizada) se descarta', () => {
    expect(reconcileTimer(null, stored(base, true, base.updatedAt))).toEqual({
      timer: null,
      push: false,
    })
  })

  it('una pausa hecha sin conexión, más nueva que Supabase, gana y se sube', () => {
    expect(reconcileTimer(base, stored(pausedLater, false, pausedLater.updatedAt))).toEqual({
      timer: pausedLater,
      push: true,
    })
  })

  it('un temporizador iniciado sin conexión se sube aunque Supabase no tenga nada', () => {
    expect(reconcileTimer(null, stored(base, false, base.updatedAt))).toEqual({
      timer: base,
      push: true,
    })
  })

  it('si en otro dispositivo cambió algo después, gana ese cambio', () => {
    const local = stored(base, false, '2026-11-19T14:10:00.000Z')
    expect(reconcileTimer(pausedLater, local)).toEqual({ timer: pausedLater, push: false })
  })
})

describe('localStorage', () => {
  it('guarda y lee la copia de la misma cuenta, e ignora la de otra cuenta', () => {
    writeStoredTimer(stored(base, true, base.updatedAt))
    expect(readStoredTimer('u1')?.timer).toEqual(base)
    expect(readStoredTimer('otra-cuenta')).toBeNull()
  })

  it('ignora datos corruptos', () => {
    localStorage.setItem('learnai-active-timer', '{no es json')
    expect(readStoredTimer('u1')).toBeNull()
  })
})
