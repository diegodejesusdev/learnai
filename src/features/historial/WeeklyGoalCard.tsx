import { Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDuration } from '@/lib/dates'

interface WeeklyGoalCardProps {
  minutes: number
  goalMinutes: number
}

export function WeeklyGoalCard({ minutes, goalMinutes }: WeeklyGoalCardProps) {
  const remaining = Math.max(0, goalMinutes - minutes)
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Target className="size-4 text-accent" />
        Meta semanal
      </div>
      <p className="text-lg font-semibold">
        {formatDuration(minutes)}{' '}
        <span className="font-normal text-fg-muted">de {formatDuration(goalMinutes)}</span>
      </p>
      <ProgressBar value={minutes / goalMinutes} label="Avance de la meta semanal" />
      <p className="text-sm text-fg-muted">
        {remaining > 0
          ? `Te faltan ${formatDuration(remaining)} esta semana.`
          : '¡Meta cumplida esta semana!'}
      </p>
    </Card>
  )
}
