import { describe, expect, it } from 'vitest'
import { automationTrack, cloudTrack, dataTrack, tracks } from '@/data/curriculum'
import { trackTotals } from './trackTotals'

describe('minutos por ruta', () => {
  it('cada ruta suma los totales de sus fases', () => {
    expect(
      trackTotals(tracks, [
        { phaseId: 'f0', minutes: 100, sessions: 3 },
        { phaseId: 'f8', minutes: 20, sessions: 1 },
        { phaseId: 'de-f0', minutes: 45, sessions: 2 },
        { phaseId: 'cl-f1', minutes: 50, sessions: 1 },
        { phaseId: 'cl-f13', minutes: 25, sessions: 1 },
      ]),
    ).toEqual([
      { track: automationTrack, minutes: 120, sessions: 4 },
      { track: dataTrack, minutes: 45, sessions: 2 },
      { track: cloudTrack, minutes: 75, sessions: 2 },
    ])
  })

  it('una ruta sin tiempo también aparece', () => {
    expect(trackTotals(tracks, [])[1]).toEqual({ track: dataTrack, minutes: 0, sessions: 0 })
  })

  it('una fase que ya no está en ninguna ruta no se suma a otra', () => {
    const totals = trackTotals(tracks, [{ phaseId: 'f99', minutes: 30, sessions: 1 }])
    expect(totals.map((total) => total.minutes)).toEqual([0, 0, 0])
  })
})
