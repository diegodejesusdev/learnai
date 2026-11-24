import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Stat } from '@/components/ui/Stat'
import { formatDuration } from '@/lib/dates'
import { formatDays, streakHint } from '@/lib/studyStats'
import { useStudySummary } from './useStudyStats'
import { WeeklyGoalCard } from './WeeklyGoalCard'

/** Rachas y meta de la semana actual. */
export function HistorySummary() {
  const summary = useStudySummary()
  if (summary.isError) {
    return <ErrorState title="No pudimos cargar tus totales" onRetry={summary.refetch} />
  }
  if (!summary.data) return <LoadingState />

  const { streaks, todayMinutes, streakMinMinutes, weekMinutes, weeklyGoalMinutes } = summary.data
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-8">
      <Stat
        label="Racha actual"
        value={formatDays(streaks.current)}
        hint={streakHint(streaks, todayMinutes, streakMinMinutes)}
      />
      <Stat
        label="Racha máxima"
        value={formatDays(streaks.max)}
        hint={`Días con ${formatDuration(streakMinMinutes)} o más.`}
      />
      <WeeklyGoalCard
        minutes={weekMinutes}
        goalMinutes={weeklyGoalMinutes}
        className="col-span-2 lg:col-span-1"
      />
    </div>
  )
}
