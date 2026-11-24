import type { Track } from '@/lib/roadmap'
import type { PhaseTotal } from './historyApi'

export interface TrackTotal {
  track: Track
  minutes: number
  sessions: number
}

/** Minutos por ruta: la suma de los totales de sus fases (los calcula study_phase_totals). */
export function trackTotals(
  tracks: readonly Track[],
  phaseTotals: readonly PhaseTotal[],
): TrackTotal[] {
  return tracks.map((track) => {
    const ids = new Set(track.phases.map((phase) => phase.id))
    const own = phaseTotals.filter((total) => ids.has(total.phaseId))
    return {
      track,
      minutes: own.reduce((sum, total) => sum + total.minutes, 0),
      sessions: own.reduce((sum, total) => sum + total.sessions, 0),
    }
  })
}
