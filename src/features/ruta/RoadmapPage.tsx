import { PageHeader } from '@/components/ui/PageHeader'
import { ChecklistSection } from './ChecklistSection'
import { NextTopicCard } from './NextTopicCard'
import { OverviewCard } from './OverviewCard'
import { PhaseList } from './PhaseList'
import { RoadmapGate } from './RoadmapGate'
import { useRoadmap } from './useRoadmap'

export function RoadmapPage() {
  const { data } = useRoadmap()
  return (
    <>
      <PageHeader title="Ruta" description={data?.goal} />
      <RoadmapGate>
        {(roadmapData) => (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <OverviewCard {...roadmapData} />
              <NextTopicCard {...roadmapData} />
            </div>
            <PhaseList {...roadmapData} />
            <ChecklistSection {...roadmapData} />
          </div>
        )}
      </RoadmapGate>
    </>
  )
}
