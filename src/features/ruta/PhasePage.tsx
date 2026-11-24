import { ListFilter } from 'lucide-react'
import { useParams } from 'react-router'
import { NotFoundPage } from '@/app/NotFoundPage'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Section } from '@/components/ui/Section'
import { countByFilter, matchesFilter, phaseProgress, statusOf } from '@/lib/progress'
import { findPhaseIn, trackOfTarget, trackPhaseLabel, type Track } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import type { ProgressSnapshot } from './progressApi'
import { projectProgressOf, topicStatuses } from './progressModel'
import { ProjectEditor } from './ProjectEditor'
import { RoadmapGate } from './RoadmapGate'
import { StatusFilterChips } from './StatusFilterChips'
import { TopicRow } from './TopicRow'
import { useStatusFilter } from './useStatusFilter'

interface PhaseViewProps {
  track: Track
  phase: Phase
  progress: ProgressSnapshot
}

function PhaseView({ track, phase, progress }: PhaseViewProps) {
  const [filter, setFilter] = useStatusFilter()
  const statuses = topicStatuses(progress)
  const topics = phase.topics.map((topic) => ({ topic, status: statusOf(statuses, topic.id) }))
  const visible = topics.filter(({ status }) => matchesFilter(status, filter))
  const phaseValue = phaseProgress(phase, statuses)

  return (
    <>
      <PageHeader
        title={phase.title}
        eyebrow={trackPhaseLabel(track, phase)}
        description={phase.summary}
        back={{ to: `/ruta?ruta=${track.id}`, label: 'Ruta' }}
      />
      <div className="flex flex-col gap-8">
        <Card>
          <ProgressBar
            value={phaseValue.ratio}
            label={`Progreso · ${phaseValue.done} de ${phaseValue.total} temas`}
            showLabel
          />
        </Card>
        <Section title="Temas" description="Toca el estado de un tema para avanzarlo.">
          <StatusFilterChips
            label="Filtrar temas por estado"
            value={filter}
            counts={countByFilter(topics.map(({ status }) => status))}
            onChange={setFilter}
          />
          {visible.length === 0 ? (
            <EmptyState icon={ListFilter} title="Ningún tema con ese estado" />
          ) : (
            <Card className="p-2 sm:p-2">
              <ul className="divide-y divide-border">
                {visible.map(({ topic, status }) => (
                  <li key={topic.id}>
                    <TopicRow topic={topic} status={status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </Section>
        <Section title="Proyecto de la fase">
          {/* key: el formulario se reinicia si cambias de fase */}
          <ProjectEditor
            key={phase.id}
            phase={phase}
            project={projectProgressOf(progress, phase.id)}
          />
        </Section>
      </div>
    </>
  )
}

export function PhasePage() {
  const { phaseId = '' } = useParams()
  return (
    <RoadmapGate>
      {({ roadmap, progress }) => {
        const track = trackOfTarget(roadmap.tracks, { topicId: null, projectPhaseId: phaseId })
        const phase = findPhaseIn(track?.phases ?? [], phaseId)
        if (!track || !phase) return <NotFoundPage />
        return <PhaseView track={track} phase={phase} progress={progress} />
      }}
    </RoadmapGate>
  )
}
