import { useQuery } from '@tanstack/react-query'
import { useUserSettings } from '@/features/ajustes/useUserSettings'
import { toDayKey } from '@/lib/dates'
import { studyStatsKey } from '@/lib/sessionQueries'
import {
  computeStreaks,
  currentWeekMinutes,
  firstOfRecentWeeks,
  minutesOnDay,
  type Streaks,
} from '@/lib/studyStats'
import { fetchDayTotals, fetchPhaseTotals, fetchWeekTotals } from './historyApi'

/** Semanas de la gráfica de minutos por semana (la actual incluida). */
export const RECENT_WEEKS = 12

/** Hoy en Bogotá ('yyyy-MM-dd'). */
export function todayKey(): string {
  return toDayKey(new Date())
}

export function useDayTotals() {
  return useQuery({ queryKey: [...studyStatsKey, 'days'], queryFn: fetchDayTotals, staleTime: 0 })
}

export function useWeekTotals(today: string) {
  const fromWeek = firstOfRecentWeeks(today, RECENT_WEEKS)
  return useQuery({
    queryKey: [...studyStatsKey, 'weeks', fromWeek],
    queryFn: () => fetchWeekTotals(fromWeek),
    staleTime: 0,
  })
}

export function usePhaseTotals() {
  return useQuery({
    queryKey: [...studyStatsKey, 'phases'],
    queryFn: fetchPhaseTotals,
    staleTime: 0,
  })
}

export interface StudySummary {
  today: string
  todayMinutes: number
  streaks: Streaks
  weekMinutes: number
  weeklyGoalMinutes: number
  streakMinMinutes: number
}

/** Minutos de hoy, rachas y avance de la semana: lo que muestran Inicio y el Historial. */
export function useStudySummary() {
  const today = todayKey()
  const days = useDayTotals()
  const weeks = useWeekTotals(today)
  const settings = useUserSettings()

  const data: StudySummary | undefined =
    days.data && weeks.data && settings.data
      ? {
          today,
          todayMinutes: minutesOnDay(days.data, today),
          streaks: computeStreaks(days.data, today, settings.data.streak_min_minutes),
          weekMinutes: currentWeekMinutes(weeks.data, today),
          weeklyGoalMinutes: settings.data.weekly_goal_minutes,
          streakMinMinutes: settings.data.streak_min_minutes,
        }
      : undefined

  return {
    data,
    isError: days.isError || weeks.isError || settings.isError,
    refetch: () => {
      void days.refetch()
      void weeks.refetch()
      void settings.refetch()
    },
  }
}
