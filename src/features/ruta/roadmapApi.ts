import type { QueryData } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { ChecklistItem, Phase } from '@/types/curriculum'

export interface Roadmap {
  title: string
  goal: string
  phases: Phase[]
  checklist: ChecklistItem[]
}

function phasesQuery() {
  return supabase
    .from('phases')
    .select(
      'id, sort_order, title, summary, estimated_weeks, project_title, project_description, topics (id, sort_order, title, details)',
    )
    .order('sort_order')
}

export type PhaseRow = QueryData<ReturnType<typeof phasesQuery>>[number]

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

export async function fetchRoadmap(): Promise<Roadmap> {
  const [meta, phases, checklist] = await Promise.all([
    supabase.from('curriculum_meta').select('title, goal').maybeSingle(),
    phasesQuery(),
    supabase.from('checklist_items').select('id, text').order('sort_order'),
  ])
  if (meta.error) throw meta.error
  if (phases.error) throw phases.error
  if (checklist.error) throw checklist.error

  return {
    title: meta.data?.title ?? '',
    goal: meta.data?.goal ?? '',
    phases: phases.data.map(toPhase),
    checklist: checklist.data,
  }
}
