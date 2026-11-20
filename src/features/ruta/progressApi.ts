import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import type { ProgressStatus } from '@/types/progress'

export type TopicProgress = Pick<Tables<'topic_progress'>, 'status' | 'notes' | 'completed_at'>
export type ProjectProgress = Pick<
  Tables<'project_progress'>,
  'status' | 'repo_url' | 'demo_url' | 'notes' | 'completed_at'
>
export type ChecklistProgress = Pick<Tables<'checklist_progress'>, 'done' | 'done_at'>

/** Todo el progreso del usuario, indexado por id de tema, de fase o de ítem. */
export interface ProgressSnapshot {
  topics: Readonly<Partial<Record<string, TopicProgress>>>
  projects: Readonly<Partial<Record<string, ProjectProgress>>>
  checklist: Readonly<Partial<Record<string, ChecklistProgress>>>
}

export type ProjectPatch = Partial<
  Pick<ProjectProgress, 'status' | 'repo_url' | 'demo_url' | 'notes'>
>

export async function fetchProgress(): Promise<ProgressSnapshot> {
  // RLS devuelve solo las filas del usuario con sesión.
  const [topics, projects, checklist] = await Promise.all([
    supabase.from('topic_progress').select('topic_id, status, notes, completed_at'),
    supabase
      .from('project_progress')
      .select('phase_id, status, repo_url, demo_url, notes, completed_at'),
    supabase.from('checklist_progress').select('item_id, done, done_at'),
  ])
  if (topics.error) throw topics.error
  if (projects.error) throw projects.error
  if (checklist.error) throw checklist.error

  return {
    topics: Object.fromEntries(topics.data.map(({ topic_id, ...row }) => [topic_id, row])),
    projects: Object.fromEntries(projects.data.map(({ phase_id, ...row }) => [phase_id, row])),
    checklist: Object.fromEntries(checklist.data.map(({ item_id, ...row }) => [item_id, row])),
  }
}

// Upsert por (user_id, id): crea la fila la primera vez y después solo cambia las columnas
// enviadas. user_id lo pone la base (default auth.uid()) y completed_at / done_at, los triggers.

export async function saveTopicStatus(topicId: string, status: ProgressStatus): Promise<void> {
  const { error } = await supabase
    .from('topic_progress')
    .upsert({ topic_id: topicId, status }, { onConflict: 'user_id,topic_id' })
  if (error) throw error
}

export async function saveTopicNotes(topicId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('topic_progress')
    .upsert({ topic_id: topicId, notes }, { onConflict: 'user_id,topic_id' })
  if (error) throw error
}

export async function saveProject(phaseId: string, patch: ProjectPatch): Promise<void> {
  const { error } = await supabase
    .from('project_progress')
    .upsert({ phase_id: phaseId, ...patch }, { onConflict: 'user_id,phase_id' })
  if (error) throw error
}

export async function saveChecklistItem(itemId: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from('checklist_progress')
    .upsert({ item_id: itemId, done }, { onConflict: 'user_id,item_id' })
  if (error) throw error
}

/** Minutos netos estudiados en un tema (suma de sus sesiones). */
export async function fetchTopicMinutes(topicId: string): Promise<number> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('duration_minutes')
    .eq('topic_id', topicId)
  if (error) throw error
  return data.reduce((sum, session) => sum + session.duration_minutes, 0)
}
