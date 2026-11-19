import { ChevronRight } from 'lucide-react'
import { CardLink } from '@/components/ui/CardLink'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { phaseLabel } from '@/data/curriculum'
import { demoProjectStatuses, demoTopicStatuses } from '@/data/demo'
import { phaseProgress } from '@/lib/progress'
import type { Phase } from '@/types/curriculum'

function weeksLabel(weeks: number): string {
  return weeks === 1 ? '1 semana' : `${weeks} semanas`
}

export function PhaseCard({ phase }: { phase: Phase }) {
  const progress = phaseProgress(phase, demoTopicStatuses, demoProjectStatuses)
  return (
    <CardLink to={`/ruta/${phase.id}`} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-accent">
            {phaseLabel(phase)} · {weeksLabel(phase.estimated_weeks)}
          </p>
          <h3 className="font-semibold">{phase.title}</h3>
          <p className="line-clamp-2 text-sm text-fg-muted">{phase.summary}</p>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-fg-muted" />
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar
          value={progress.ratio}
          label={`Progreso de ${phase.title}`}
          size="sm"
          className="flex-1"
        />
        <span className="text-xs text-fg-muted tabular-nums">
          {progress.done}/{progress.total}
        </span>
      </div>
    </CardLink>
  )
}
