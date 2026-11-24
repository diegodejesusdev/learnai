import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { doneCount, totalProgress } from '@/lib/progress'
import { checklistDoneCount, projectStatuses, topicStatuses } from './progressModel'
import type { TrackData } from './RoadmapGate'

/** Progreso total de una ruta (temas) y, aparte, proyectos y checklist. */
export function OverviewCard({ track, progress }: TrackData) {
  const topics = totalProgress(track.phases, topicStatuses(progress))
  const projects = doneCount(
    track.phases.map((phase) => phase.id),
    projectStatuses(progress),
  )

  return (
    <Card className="flex flex-col gap-3">
      <ProgressBar
        value={topics.ratio}
        label={`Progreso total · ${topics.done} de ${topics.total} temas`}
        showLabel
      />
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
        <span>
          Proyectos:{' '}
          <strong className="font-medium text-fg tabular-nums">
            {projects.done}/{projects.total}
          </strong>
        </span>
        <span>
          Checklist final:{' '}
          <strong className="font-medium text-fg tabular-nums">
            {checklistDoneCount(progress, track.checklist)}/{track.checklist.length}
          </strong>
        </span>
      </p>
    </Card>
  )
}
