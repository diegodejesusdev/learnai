import { ChevronRight, Route } from 'lucide-react'
import { CardLink } from '@/components/ui/CardLink'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { totalProgress } from '@/lib/progress'
import { topicStatuses } from '@/features/ruta/progressModel'
import type { RoadmapData } from '@/features/ruta/RoadmapGate'

export function TotalProgressCard({ roadmap, progress }: RoadmapData) {
  const total = totalProgress(roadmap.phases, topicStatuses(progress))
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
        {total.done}{' '}
        <span className="font-normal text-fg-muted">de {total.total} temas hechos</span>
      </p>
      <ProgressBar value={total.ratio} label="Progreso total de la ruta" showLabel />
    </CardLink>
  )
}
