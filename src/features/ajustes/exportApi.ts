import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

// Todos tus datos, para «Exportar mis datos» (Ajustes). Cada consulta va con tu sesión: el RLS
// solo devuelve tus filas.

export interface ExportRows {
  settings: Tables<'user_settings'> | null
  topicProgress: Tables<'topic_progress'>[]
  projectProgress: Tables<'project_progress'>[]
  checklist: Tables<'checklist_progress'>[]
  lessons: Tables<'lesson_progress'>[]
  sessions: Tables<'study_sessions'>[]
  conversations: Tables<'tutor_conversations'>[]
  messages: Tables<'tutor_messages'>[]
  quizResults: Tables<'quiz_results'>[]
  // Contenido: para saber de qué ruta es cada registro.
  tracks: Tables<'tracks'>[]
  phases: Pick<Tables<'phases'>, 'id' | 'track_id'>[]
  topics: Pick<Tables<'topics'>, 'id' | 'phase_id'>[]
  checklistItems: Pick<Tables<'checklist_items'>, 'id' | 'track_id'>[]
}

const PAGE = 1000

/** Supabase devuelve como máximo 1000 filas por consulta: se piden por tandas. */
async function allRows<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return rows
  }
}

export async function fetchExportRows(): Promise<ExportRows> {
  const [
    settings,
    topicProgress,
    projectProgress,
    checklist,
    lessons,
    sessions,
    conversations,
    messages,
    quizResults,
    tracks,
    phases,
    topics,
    checklistItems,
  ] = await Promise.all([
    supabase.from('user_settings').select('*').maybeSingle(),
    allRows((from, to) =>
      supabase.from('topic_progress').select('*').order('topic_id').range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('project_progress').select('*').order('phase_id').range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('checklist_progress').select('*').order('item_id').range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('lesson_progress').select('*').order('topic_id').range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('study_sessions').select('*').order('started_at').order('id').range(from, to),
    ),
    allRows((from, to) =>
      supabase
        .from('tutor_conversations')
        .select('*')
        .order('created_at')
        .order('id')
        .range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('tutor_messages').select('*').order('created_at').order('id').range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('quiz_results').select('*').order('created_at').order('id').range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('tracks').select('*').order('sort_order').order('id').range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('phases').select('id, track_id').order('id').range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('topics').select('id, phase_id').order('id').range(from, to),
    ),
    allRows((from, to) =>
      supabase.from('checklist_items').select('id, track_id').order('id').range(from, to),
    ),
  ])
  if (settings.error) throw settings.error
  return {
    settings: settings.data,
    topicProgress,
    projectProgress,
    checklist,
    lessons,
    sessions,
    conversations,
    messages,
    quizResults,
    tracks,
    phases,
    topics,
    checklistItems,
  }
}
