import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../src/types/database.ts'
import { bogotaMondayKey } from '../_shared/bogota.ts'
import { MAX_SESSIONS, type ContextPhase, type TutorContextData } from '../_shared/tutorContext.ts'
import { TutorError } from '../_shared/tutorErrors.ts'
import type { TutorRequest } from '../_shared/tutorTypes.ts'

// Consultas de la función. Todas van con el cliente del usuario: el RLS decide qué ve.

export type Db = SupabaseClient<Database>

function fail(error: { message: string } | null): never {
  console.error('tutor: error de la base', error?.message)
  throw new TutorError('unknown', 'No se pudieron leer tus datos de LearnAI. Inténtalo de nuevo.')
}

function rows<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error || result.data === null || result.data === undefined) fail(result.error)
  return result.data
}

/** Todo lo que necesita el contexto, en paralelo. */
export async function loadContextData(
  db: Db,
  request: TutorRequest,
  now: Date,
): Promise<TutorContextData> {
  const dailyPlan = request.mode === 'daily_plan'
  const [meta, phases, topics, statuses, topicNotes, projects, sessions, settings, week] =
    await Promise.all([
      db.from('curriculum_meta').select('title, goal').maybeSingle(),
      db
        .from('phases')
        .select('id, sort_order, title, summary, project_title, project_description')
        .order('sort_order'),
      db.from('topics').select('id, phase_id, title, details').order('sort_order'),
      db.from('topic_progress').select('topic_id, status'),
      request.topicId
        ? db.from('topic_progress').select('notes').eq('topic_id', request.topicId).maybeSingle()
        : null,
      db.from('project_progress').select('phase_id, status, notes, repo_url, demo_url'),
      db
        .from('study_sessions')
        .select('started_at, duration_minutes, topic_id, project_phase_id')
        .order('started_at', { ascending: false })
        .limit(MAX_SESSIONS),
      dailyPlan ? db.from('user_settings').select('weekly_goal_minutes').maybeSingle() : null,
      dailyPlan ? db.rpc('study_week_totals', { p_from: bogotaMondayKey(now) }) : null,
    ])

  const topicRows = rows(topics)
  const contextPhases: ContextPhase[] = rows(phases).map((phase) => ({
    id: phase.id,
    order: phase.sort_order,
    title: phase.title,
    summary: phase.summary,
    projectTitle: phase.project_title,
    projectDescription: phase.project_description,
    topics: topicRows
      .filter((topic) => topic.phase_id === phase.id)
      .map(({ id, title, details }) => ({ id, title, details })),
  }))
  const projectRows = rows(projects)
  const project = projectRows.find((row) => row.phase_id === request.phaseId)
  const metaRow = meta.data

  return {
    curriculumTitle: metaRow?.title ?? 'Ruta de LearnAI',
    goal: metaRow?.goal ?? '',
    phases: contextPhases,
    topicStatuses: Object.fromEntries(rows(statuses).map((row) => [row.topic_id, row.status])),
    projectStatuses: Object.fromEntries(projectRows.map((row) => [row.phase_id, row.status])),
    topic: request.topicId ? { id: request.topicId, notes: topicNotes?.data?.notes ?? '' } : null,
    project: request.phaseId
      ? {
          phaseId: request.phaseId,
          notes: project?.notes ?? '',
          repoUrl: project?.repo_url ?? null,
          demoUrl: project?.demo_url ?? null,
        }
      : null,
    sessions: rows(sessions).map((session) => ({
      startedAt: session.started_at,
      durationMinutes: session.duration_minutes,
      topicId: session.topic_id,
      projectPhaseId: session.project_phase_id,
    })),
    week: dailyPlan
      ? {
          minutes: week?.data?.[0]?.minutes ?? 0,
          goalMinutes: settings?.data?.weekly_goal_minutes ?? 600,
        }
      : null,
  }
}

/** Mensajes del usuario desde un instante (para el límite diario). */
export async function countUserMessagesSince(db: Db, since: Date): Promise<number> {
  const { count, error } = await db
    .from('tutor_messages')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', since.toISOString())
  if (error) fail(error)
  return count ?? 0
}

/** null si no existe (o es de otra persona: el RLS la oculta). */
export async function findConversation(db: Db, id: string) {
  const { data, error } = await db
    .from('tutor_conversations')
    .select('id, mode, topic_id, phase_id')
    .eq('id', id)
    .maybeSingle()
  if (error) fail(error)
  return data
}

export async function createConversation(db: Db, request: TutorRequest, title: string) {
  const { id } = rows(
    await db
      .from('tutor_conversations')
      .insert({ mode: request.mode, topic_id: request.topicId, phase_id: request.phaseId, title })
      .select('id')
      .single(),
  )
  return id
}

/** Los últimos mensajes, del más antiguo al más reciente. */
export async function loadHistory(db: Db, conversationId: string, limit: number) {
  const history = rows(
    await db
      .from('tutor_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit),
  )
  return history.reverse()
}

export async function insertMessage(
  db: Db,
  message: {
    conversation_id: string
    role: 'user' | 'assistant'
    content: string
    model?: string | null
    tokens_in?: number | null
    tokens_out?: number | null
  },
): Promise<string> {
  return rows(await db.from('tutor_messages').insert(message).select('id').single()).id
}

export async function deleteMessage(db: Db, id: string): Promise<void> {
  await db.from('tutor_messages').delete().eq('id', id)
}

export async function deleteConversation(db: Db, id: string): Promise<void> {
  await db.from('tutor_conversations').delete().eq('id', id)
}

/** Sube la conversación al principio de la lista (el trigger pone updated_at = now()). */
export async function touchConversation(db: Db, id: string): Promise<void> {
  await db.from('tutor_conversations').update({ updated_at: new Date().toISOString() }).eq('id', id)
}
