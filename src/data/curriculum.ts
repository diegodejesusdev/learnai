import type { Track } from '@/lib/roadmap'
import type { Curriculum, Phase } from '@/types/curriculum'

// Las rutas de src/data/routes/, para los tests. La app las lee de Supabase (el seed las carga).
const files = import.meta.glob<Curriculum>('./routes/*.json', { eager: true, import: 'default' })

/** El archivo de una ruta con la misma forma que devuelve fetchRoadmap. */
function toTrack(curriculum: Curriculum): Track {
  return {
    ...curriculum.track,
    goal: curriculum.goal,
    phases: [...curriculum.phases].sort((a, b) => a.order - b.order),
    checklist: curriculum.final_checklist,
  }
}

export const tracks: readonly Track[] = Object.values(files)
  .map(toTrack)
  .sort((a, b) => a.order - b.order)

function trackById(id: string): Track {
  const track = tracks.find((candidate) => candidate.id === id)
  if (!track) throw new Error(`Falta la ruta ${id} en src/data/routes`)
  return track
}

export const automationTrack = trackById('automatizacion')
export const dataTrack = trackById('ingenieria-datos')
export const cloudTrack = trackById('cloud')

/** Fases de automatización, la ruta que usa la mayoría de los tests. */
export const phases: readonly Phase[] = automationTrack.phases
