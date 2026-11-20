import { Flame, Trophy } from 'lucide-react'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { StatCard } from '@/components/ui/StatCard'
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Flame}
          label="Racha actual"
          value={formatDays(streaks.current)}
          hint={streakHint(streaks, todayMinutes, streakMinMinutes)}
        />
        <StatCard
          icon={Trophy}
          label="Racha máxima"
          value={formatDays(streaks.max)}
          hint={`Días con ${formatDuration(streakMinMinutes)} o más.`}
        />
      </div>
      <WeeklyGoalCard minutes={weekMinutes} goalMinutes={weeklyGoalMinutes} />
    </div>
  )
}
