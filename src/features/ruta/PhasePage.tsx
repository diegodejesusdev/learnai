import { ListFilter } from 'lucide-react'
import { useParams } from 'react-router'
import { NotFoundPage } from '@/app/NotFoundPage'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Section } from '@/components/ui/Section'
import { DownloadPhase } from '@/features/leccion/DownloadPhase'
import { isLessonRead } from '@/features/leccion/lessonModel'
import { useLessonProgress } from '@/features/leccion/useLessonProgress'
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
  const { data: lessons } = useLessonProgress()
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
      <div className="grid gap-12 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <ProgressBar
          value={phaseValue.ratio}
          label={`Progreso · ${phaseValue.done} de ${phaseValue.total} temas`}
          showLabel
          className="xl:col-span-2"
        />
        <Section title="Temas" description="Toca el círculo de un tema para avanzar su estado.">
          <StatusFilterChips
            label="Filtrar temas por estado"
            value={filter}
            counts={countByFilter(topics.map(({ status }) => status))}
            onChange={setFilter}
          />
          {visible.length === 0 ? (
            <EmptyState icon={ListFilter} title="Ningún tema con ese estado" />
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {visible.map(({ topic, status }) => (
                <li key={topic.id}>
                  <TopicRow
                    topic={topic}
                    status={status}
                    lessonRead={isLessonRead(lessons, topic.id)}
                  />
                </li>
              ))}
            </ul>
          )}
          <DownloadPhase phase={phase} trackId={track.id} />
        </Section>
        <Section title="Proyecto de la fase" className="self-start">
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
