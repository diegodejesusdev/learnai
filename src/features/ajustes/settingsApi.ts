import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

export type UserSettings = Pick<
  Tables<'user_settings'>,
  'weekly_goal_minutes' | 'pomodoro_work_min' | 'pomodoro_break_min' | 'theme'
>

/** Valores por defecto de la base, por si la fila aún no existe. */
export const defaultSettings: UserSettings = {
  weekly_goal_minutes: 600,
  pomodoro_work_min: 25,
  pomodoro_break_min: 5,
  theme: 'system',
}

export async function fetchUserSettings(): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('weekly_goal_minutes, pomodoro_work_min, pomodoro_break_min, theme')
    .maybeSingle()
  if (error) throw error
  return data ?? defaultSettings
}

/** Upsert: la fila la crea un trigger al registrarse, pero así no falla si faltara. */
export async function saveUserSettings(patch: Partial<UserSettings>): Promise<void> {
  const { error } = await supabase.from('user_settings').upsert(patch, { onConflict: 'user_id' })
  if (error) throw error
}
