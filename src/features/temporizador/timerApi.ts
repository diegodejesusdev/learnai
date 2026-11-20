import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database'
import type { ActiveTimer, StudyTargetRef } from './timerModel'

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

/** Iniciar: insert (no upsert) para no pisar una sesión iniciada en otro dispositivo. */
export async function insertActiveTimer(timer: ActiveTimer): Promise<void> {
  const { error } = await supabase.from('active_timer').insert(toRow(timer))
  if (error?.code === '23505') throw new TimerConflictError()
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

export interface FinishInput {
  endedAt: string
  durationMinutes: number
  notes: string
  markDone: boolean
}

/** Guarda la sesión y borra el temporizador en una sola transacción (función SQL). */
export async function finishActiveTimer(input: FinishInput): Promise<string> {
  const { data, error } = await supabase.rpc('finish_active_timer', {
    p_ended_at: input.endedAt,
    p_duration_minutes: input.durationMinutes,
    p_notes: input.notes,
    p_mark_done: input.markDone,
  })
  if (error?.code === 'P0002') throw new TimerGoneError()
  if (error) throw error
  return data
}

export interface ManualSessionInput {
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
  })
  if (error) throw error
  return data
}
