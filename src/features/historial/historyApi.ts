import { supabase } from '@/lib/supabase'
import type { DayTotal, WeekTotal } from '@/lib/studyStats'

// Totales calculados en la base (migración history_stats), en hora de Bogotá.
// Devuelven una fila por día, semana o fase; nunca las sesiones sueltas.

export interface PhaseTotal {
  phaseId: string
  minutes: number
  sessions: number
}

/** Todos los días con estudio, del más antiguo al más reciente (para las rachas y el mapa). */
export async function fetchDayTotals(): Promise<DayTotal[]> {
  const { data, error } = await supabase.rpc('study_day_totals')
  if (error) throw error
  return data
}

/** Semanas desde el lunes `fromWeek` ('yyyy-MM-dd'). */
export async function fetchWeekTotals(fromWeek: string): Promise<WeekTotal[]> {
  const { data, error } = await supabase.rpc('study_week_totals', { p_from: fromWeek })
  if (error) throw error
  return data.map((row) => ({
    weekStart: row.week_start,
    minutes: row.minutes,
    sessions: row.sessions,
  }))
}

export async function fetchPhaseTotals(): Promise<PhaseTotal[]> {
  const { data, error } = await supabase.rpc('study_phase_totals')
  if (error) throw error
  return data.map((row) => ({
    phaseId: row.phase_id,
    minutes: row.minutes,
    sessions: row.sessions,
  }))
}
