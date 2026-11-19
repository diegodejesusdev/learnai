import { Card } from '@/components/ui/Card'
import { DemoNotice } from '@/components/ui/DemoNotice'
import { PageHeader } from '@/components/ui/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Section } from '@/components/ui/Section'
import { demoProjectStatuses, demoTopicStatuses } from '@/data/demo'
import { totalProgress } from '@/lib/progress'
import { ChecklistSection } from './ChecklistSection'
import { PhaseCard } from './PhaseCard'
import { RoadmapGate } from './RoadmapGate'
import type { Roadmap } from './roadmapApi'
import { useRoadmap } from './useRoadmap'

function RoadmapContent({ roadmap }: { roadmap: Roadmap }) {
  const total = totalProgress(roadmap.phases, demoTopicStatuses, demoProjectStatuses)
  return (
    <>
      <DemoNotice>
        Las fases y temas vienen de Supabase. Los estados aún son de ejemplo (fase 3).
      </DemoNotice>
      <div className="flex flex-col gap-8">
        <Card>
          <ProgressBar
            value={total.ratio}
            label={`Progreso total · ${total.done} de ${total.total}`}
            showLabel
          />
        </Card>
        <Section title="Fases" description={`${roadmap.phases.length} fases · ${roadmap.title}`}>
          <ol className="flex flex-col gap-3">
            {roadmap.phases.map((phase) => (
              <li key={phase.id}>
                <PhaseCard phase={phase} />
              </li>
            ))}
          </ol>
        </Section>
        <ChecklistSection items={roadmap.checklist} />
      </div>
    </>
  )
}

export function RoadmapPage() {
  const { data } = useRoadmap()
  return (
    <>
      <PageHeader title="Ruta" description={data?.goal} />
      <RoadmapGate>{(roadmap) => <RoadmapContent roadmap={roadmap} />}</RoadmapGate>
    </>
  )
}
