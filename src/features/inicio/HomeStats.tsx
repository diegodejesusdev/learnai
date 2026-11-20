import { Clock, Flame } from 'lucide-react'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatCard } from '@/components/ui/StatCard'
import { useStudySummary } from '@/features/historial/useStudyStats'
import { WeeklyGoalCard } from '@/features/historial/WeeklyGoalCard'
import { formatDuration } from '@/lib/dates'
import { formatDays, streakHint } from '@/lib/studyStats'

/** Minutos de hoy, racha y meta semanal, calculados en la base. */
export function HomeStats() {
  const summary = useStudySummary()
  if (summary.isError) {
    return <ErrorState title="No pudimos cargar tus totales" onRetry={summary.refetch} />
  }
  const data = summary.data
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Clock}
          label="Hoy"
          value={data ? formatDuration(data.todayMinutes) : '…'}
          hint={data && streakHint(data.streaks, data.todayMinutes, data.streakMinMinutes)}
        />
        <StatCard
          icon={Flame}
          label="Racha"
          value={data ? formatDays(data.streaks.current) : '…'}
          hint={data && `Máxima: ${formatDays(data.streaks.max)}`}
        />
      </div>
      {data && <WeeklyGoalCard minutes={data.weekMinutes} goalMinutes={data.weeklyGoalMinutes} />}
    </>
  )
}
