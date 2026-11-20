import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'
import type { ActiveTimer, StudyTargetRef, TimerMode } from './timerModel'

/** La sesión ya no existe en Supabase (se terminó o descartó en otro dispositivo). */
export class TimerGoneError extends Error {
  constructor() {
    super('El temporizador ya no existe')
  }
}

/** Ya hay un temporizador activo en otro dispositivo. */
export class TimerConflictError extends Error {
  constructor() {
    super('Ya hay un temporizador activo')
  }
}

function toTimer(row: Tables<'active_timer'>): ActiveTimer {
  const ref: StudyTargetRef = row.topic_id
    ? { topicId: row.topic_id, projectPhaseId: null }
    : { topicId: null, projectPhaseId: row.project_phase_id ?? '' }
  return {
    sessionId: row.session_id,
    mode: row.mode,
    ...ref,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    pausedSeconds: row.paused_seconds,
    workMin: row.work_min,
    breakMin: row.break_min,
    updatedAt: row.updated_at,
  }
}

function toRow(timer: ActiveTimer): TablesInsert<'active_timer'> {
  return {
    session_id: timer.sessionId,
    mode: timer.mode,
    topic_id: timer.topicId,
    project_phase_id: timer.projectPhaseId,
    started_at: timer.startedAt,
    paused_at: timer.pausedAt,
    paused_seconds: timer.pausedSeconds,
    work_min: timer.workMin,
    break_min: timer.breakMin,
    updated_at: timer.updatedAt,
  }
}

export async function fetchActiveTimer(): Promise<ActiveTimer | null> {
  const { data, error } = await supabase.from('active_timer').select('*').maybeSingle()
  if (error) throw error
  return data ? toTimer(data) : null
}

/**
 * Iniciar: insert (no upsert) para no pisar una sesión iniciada en otro dispositivo.
 * Si ya hay uno y es este mismo (lo subió la copia local al volver la conexión), está bien.
 */
export async function insertActiveTimer(timer: ActiveTimer): Promise<void> {
  const { error } = await supabase.from('active_timer').insert(toRow(timer))
  if (error?.code === '23505') {
    const current = await fetchActiveTimer()
    if (current?.sessionId === timer.sessionId) return
    throw new TimerConflictError()
  }
  if (error) throw error
}

/** Pausar / reanudar: update, que no resucita una sesión ya terminada en otro dispositivo. */
export async function updateActiveTimer(userId: string, timer: ActiveTimer): Promise<void> {
  const { data, error } = await supabase
    .from('active_timer')
    .update(toRow(timer))
    .eq('user_id', userId)
    .select('user_id')
  if (error) throw error
  if (data.length === 0) throw new TimerGoneError()
}

/** Para subir lo que se hizo sin conexión (ver reconcileTimer). */
export async function upsertActiveTimer(timer: ActiveTimer): Promise<void> {
  const { error } = await supabase
    .from('active_timer')
    .upsert(toRow(timer), { onConflict: 'user_id' })
  if (error) throw error
}

export async function deleteActiveTimer(userId: string): Promise<void> {
  const { error } = await supabase.from('active_timer').delete().eq('user_id', userId)
  if (error) throw error
}

/** Todo lo necesario para guardar la sesión de un temporizador, aunque nunca llegara a la base. */
export interface FinishInput {
  sessionId: string
  startedAt: string
  mode: TimerMode
  topicId: string | null
  projectPhaseId: string | null
  endedAt: string
  durationMinutes: number
  notes: string
  markDone: boolean
}

/**
 * Guarda la sesión y borra el temporizador en una sola transacción (función SQL).
 * Va con el id del temporizador: si se reintenta desde la cola, no se duplica.
 */
export async function finishActiveTimer(input: FinishInput): Promise<string> {
  const { data, error } = await supabase.rpc('finish_active_timer', {
    p_session_id: input.sessionId,
    p_started_at: input.startedAt,
    p_ended_at: input.endedAt,
    p_duration_minutes: input.durationMinutes,
    p_mode: input.mode,
    ...(input.topicId !== null
      ? { p_topic_id: input.topicId }
      : { p_project_phase_id: input.projectPhaseId ?? '' }),
    p_notes: input.notes,
    p_mark_done: input.markDone,
  })
  if (error) throw error
  return data
}

export interface ManualSessionInput {
  /** Id generado en el dispositivo: si se reintenta desde la cola, no se duplica. */
  id: string
  target: StudyTargetRef
  startedAt: string
  endedAt: string
  durationMinutes: number
  notes: string
  markDone: boolean
}

export async function recordManualSession(input: ManualSessionInput): Promise<string> {
  const { target } = input
  const { data, error } = await supabase.rpc('record_study_session', {
    p_started_at: input.startedAt,
    p_ended_at: input.endedAt,
    p_duration_minutes: input.durationMinutes,
    p_mode: 'manual',
    ...(target.topicId !== null
      ? { p_topic_id: target.topicId }
      : { p_project_phase_id: target.projectPhaseId }),
    p_notes: input.notes,
    p_mark_done: input.markDone,
    p_id: input.id,
  })
  if (error) throw error
  return data
}
