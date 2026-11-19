import { ChevronRight, Route } from 'lucide-react'
import { CardLink } from '@/components/ui/CardLink'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { phases } from '@/data/curriculum'
import { demoProjectStatuses, demoTopicStatuses } from '@/data/demo'
import { totalProgress } from '@/lib/progress'

export function TotalProgressCard() {
  const progress = totalProgress(phases, demoTopicStatuses, demoProjectStatuses)
  return (
    <CardLink to="/ruta" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm text-fg-muted">
          <Route className="size-4 text-accent" />
          Progreso de la ruta
        </span>
        <ChevronRight className="size-5 text-fg-muted" />
      </div>
      <p className="text-lg font-semibold">
        {progress.done}{' '}
        <span className="font-normal text-fg-muted">de {progress.total} temas y proyectos</span>
      </p>
      <ProgressBar value={progress.ratio} label="Progreso total de la ruta" showLabel />
    </CardLink>
  )
}
