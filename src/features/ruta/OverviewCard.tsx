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
  const label = `Progreso total · ${topics.done} de ${topics.total} temas`

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-10">
        <p aria-hidden className="text-giant text-meter">
          {Math.round(topics.ratio * 100)}
          <span className="text-[0.4em] tracking-tight"> %</span>
        </p>
        <div className="flex flex-col gap-1 sm:pb-1">
          <p className="text-lg font-bold tracking-tight">{label}</p>
          <p className="flex flex-wrap gap-x-6 gap-y-1 text-fg-muted">
            <span>
              Proyectos:{' '}
              <strong className="font-bold text-fg tabular-nums">
                {projects.done}/{projects.total}
              </strong>
            </span>
            <span>
              Checklist final:{' '}
              <strong className="font-bold text-fg tabular-nums">
                {checklistDoneCount(progress, track.checklist)}/{track.checklist.length}
              </strong>
            </span>
          </p>
        </div>
      </div>
      <ProgressBar value={topics.ratio} label={label} />
    </div>
  )
}
