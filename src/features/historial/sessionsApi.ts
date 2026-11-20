import { supabase } from '@/lib/supabase'
import type { StudyTargetRef } from '@/features/temporizador/timerModel'
import type { Tables } from '@/types/database'
import type { StudyMode } from '@/types/progress'

export interface StudySession {
  id: string
  target: StudyTargetRef
  startedAt: string
  endedAt: string
  durationMinutes: number
  mode: StudyMode
  notes: string
}

/** Qué sesiones pedir. Las fechas son instantes ISO: started_at >= from y < before. */
export interface SessionQuery {
  from: string | null
  before: string | null
  /** Un tema o proyecto concreto. */
  target: StudyTargetRef | null
  /** Una fase completa: sus temas y su proyecto. */
  phase: { id: string; topicIds: readonly string[] } | null
}

export const emptySessionQuery: SessionQuery = {
  from: null,
  before: null,
  target: null,
  phase: null,
}

export const SESSION_PAGE_SIZE = 20

/** La sesión ya no existe (se borró en otro dispositivo). */
export class SessionGoneError extends Error {
  constructor() {
    super('La sesión ya no existe')
  }
}

const COLUMNS =
  'id, topic_id, project_phase_id, started_at, ended_at, duration_minutes, mode, notes'

type SessionRow = Pick<
  Tables<'study_sessions'>,
  | 'id'
  | 'topic_id'
  | 'project_phase_id'
  | 'started_at'
  | 'ended_at'
  | 'duration_minutes'
  | 'mode'
  | 'notes'
>

function toSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    target: row.topic_id
      ? { topicId: row.topic_id, projectPhaseId: null }
      : { topicId: null, projectPhaseId: row.project_phase_id ?? '' },
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMinutes: row.duration_minutes,
    mode: row.mode,
    notes: row.notes,
  }
}

/** Sesiones de la más reciente a la más antigua, de `limit` en `limit`. */
export async function fetchSessionPage(
  query: SessionQuery,
  offset: number,
  limit = SESSION_PAGE_SIZE,
): Promise<StudySession[]> {
  let request = supabase
    .from('study_sessions')
    .select(COLUMNS)
    .order('started_at', { ascending: false })
    .order('id')
    .range(offset, offset + limit - 1)
  const { from, before, target, phase } = query
  if (from) request = request.gte('started_at', from)
  if (before) request = request.lt('started_at', before)
  if (target !== null && target.topicId !== null) request = request.eq('topic_id', target.topicId)
  else if (target !== null) request = request.eq('project_phase_id', target.projectPhaseId)
  else if (phase) {
    // Los ids de la ruta son del tipo «f1-t5»: no llevan comas ni paréntesis.
    const conditions = [`project_phase_id.eq.${phase.id}`]
    if (phase.topicIds.length > 0) conditions.push(`topic_id.in.(${phase.topicIds.join(',')})`)
    request = request.or(conditions.join(','))
  }
  const { data, error } = await request
  if (error) throw error
  return data.map(toSession)
}

export async function fetchSession(id: string): Promise<StudySession | null> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle()
  // 22P02: el id de la URL no es un uuid válido.
  if (error?.code === '22P02') return null
  if (error) throw error
  return data ? toSession(data) : null
}

export async function fetchLatestSession(): Promise<StudySession | null> {
  const [latest] = await fetchSessionPage({ ...emptySessionQuery }, 0, 1)
  return latest ?? null
}

/** Todas las sesiones, de la más antigua a la más reciente (para exportar). */
export async function fetchAllSessions(): Promise<StudySession[]> {
  // Supabase devuelve como máximo 1000 filas por consulta: se piden por tandas.
  const batch = 1000
  const sessions: StudySession[] = []
  for (let offset = 0; ; offset += batch) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select(COLUMNS)
      .order('started_at')
      .order('id')
      .range(offset, offset + batch - 1)
    if (error) throw error
    sessions.push(...data.map(toSession))
    if (data.length < batch) return sessions
  }
}

export interface SessionUpdate {
  target: StudyTargetRef
  startedAt: string
  endedAt: string
  durationMinutes: number
  notes: string
}

export async function updateSession(id: string, update: SessionUpdate): Promise<void> {
  const { data, error } = await supabase
    .from('study_sessions')
    .update({
      topic_id: update.target.topicId,
      project_phase_id: update.target.projectPhaseId,
      started_at: update.startedAt,
      ended_at: update.endedAt,
      duration_minutes: update.durationMinutes,
      notes: update.notes,
    })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw new SessionGoneError()
}

export async function deleteSession(id: string): Promise<void> {
  const { data, error } = await supabase.from('study_sessions').delete().eq('id', id).select('id')
  if (error) throw error
  if (data.length === 0) throw new SessionGoneError()
}
