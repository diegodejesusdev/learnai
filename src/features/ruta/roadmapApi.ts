import type { QueryData } from '@supabase/supabase-js'
import type { Track } from '@/lib/roadmap'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { Phase } from '@/types/curriculum'

export interface Roadmap {
  /** Todas las rutas, en su orden. */
  tracks: Track[]
}

function phasesQuery() {
  return supabase
    .from('phases')
    .select(
      'id, track_id, sort_order, title, summary, estimated_weeks, project_title, project_description, topics (id, sort_order, title, details)',
    )
    .order('sort_order')
}

export type PhaseRow = QueryData<ReturnType<typeof phasesQuery>>[number]
type TrackRow = Tables<'tracks'>
type ChecklistRow = Pick<Tables<'checklist_items'>, 'id' | 'track_id' | 'text'>

/** Fila de la base → el mismo tipo Phase que usa toda la app. */
export function toPhase(row: PhaseRow): Phase {
  return {
    id: row.id,
    order: row.sort_order,
    title: row.title,
    summary: row.summary,
    estimated_weeks: row.estimated_weeks,
    project: { title: row.project_title, description: row.project_description },
    topics: [...row.topics]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ id, title, details }) => ({ id, title, details })),
  }
}

/** Agrupa las fases y la checklist en su ruta. Las filas ya vienen ordenadas. */
export function toTracks(
  tracks: readonly TrackRow[],
  phases: readonly PhaseRow[],
  checklist: readonly ChecklistRow[],
): Track[] {
  return tracks.map((track) => ({
    id: track.id,
    order: track.sort_order,
    title: track.title,
    goal: track.goal,
    phases: phases.filter((phase) => phase.track_id === track.id).map(toPhase),
    checklist: checklist
      .filter((item) => item.track_id === track.id)
      .map(({ id, text }) => ({ id, text })),
  }))
}

export async function fetchRoadmap(): Promise<Roadmap> {
  const [tracks, phases, checklist] = await Promise.all([
    supabase.from('tracks').select('id, sort_order, title, goal').order('sort_order'),
    phasesQuery(),
    supabase.from('checklist_items').select('id, track_id, text').order('sort_order'),
  ])
  if (tracks.error) throw tracks.error
  if (phases.error) throw phases.error
  if (checklist.error) throw checklist.error

  return { tracks: toTracks(tracks.data, phases.data, checklist.data) }
}
