import { PageHeader } from '@/components/ui/PageHeader'
import { RoadmapGate } from '@/features/ruta/RoadmapGate'
import { HeatmapSection } from './HeatmapSection'
import { HistorySummary } from './HistorySummary'
import { PhaseSection } from './PhaseSection'
import { SessionsSection } from './SessionsSection'
import { WeeklySection } from './WeeklySection'

export function HistoryPage() {
  return (
    <>
      <PageHeader
        title="Historial"
        description="Tu constancia y el tiempo invertido, en hora de Colombia."
      />
      <div className="flex flex-col gap-8">
        <HistorySummary />
        <RoadmapGate>
          {({ roadmap }) => (
            <>
              <HeatmapSection phases={roadmap.phases} />
              <WeeklySection />
              <PhaseSection phases={roadmap.phases} />
              <SessionsSection phases={roadmap.phases} />
            </>
          )}
        </RoadmapGate>
      </div>
    </>
  )
}
