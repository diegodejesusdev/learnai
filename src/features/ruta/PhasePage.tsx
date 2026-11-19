import { useParams } from 'react-router'
import { NotFoundPage } from '@/app/NotFoundPage'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Section } from '@/components/ui/Section'
import { demoProjectStatuses, demoTopicStatuses } from '@/data/demo'
import { phaseProgress, statusOf } from '@/lib/progress'
import { findPhaseIn, phaseLabel } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import { ProjectCard } from './ProjectCard'
import { RoadmapGate } from './RoadmapGate'
import { TopicRow } from './TopicRow'

function PhaseView({ phase }: { phase: Phase }) {
  const progress = phaseProgress(phase, demoTopicStatuses, demoProjectStatuses)
  return (
    <>
      <PageHeader
        title={phase.title}
        eyebrow={phaseLabel(phase)}
        description={phase.summary}
        back={{ to: '/ruta', label: 'Ruta' }}
      />
      <div className="flex flex-col gap-8">
        <Card>
          <ProgressBar
            value={progress.ratio}
            label={`Progreso · ${progress.done} de ${progress.total}`}
            showLabel
          />
        </Card>
        <Section title="Temas" description={`${phase.topics.length} temas`}>
          <Card className="p-2 sm:p-2">
            <ul className="divide-y divide-border">
              {phase.topics.map((topic) => (
                <li key={topic.id}>
                  <TopicRow topic={topic} status={statusOf(demoTopicStatuses, topic.id)} />
                </li>
              ))}
            </ul>
          </Card>
        </Section>
        <Section title="Proyecto de la fase">
          <ProjectCard phase={phase} status={statusOf(demoProjectStatuses, phase.id)} />
        </Section>
      </div>
    </>
  )
}

export function PhasePage() {
  const { phaseId } = useParams()
  return (
    <RoadmapGate>
      {(roadmap) => {
        const phase = findPhaseIn(roadmap.phases, phaseId)
        return phase ? <PhaseView phase={phase} /> : <NotFoundPage />
      }}
    </RoadmapGate>
  )
}
