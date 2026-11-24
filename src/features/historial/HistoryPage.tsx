import { PageHeader } from '@/components/ui/PageHeader'
import { RoadmapGate } from '@/features/ruta/RoadmapGate'
import { HeatmapSection } from './HeatmapSection'
import { HistorySummary } from './HistorySummary'
import { PhaseSection } from './PhaseSection'
import { SessionsSection } from './SessionsSection'
import { TrackFilter } from './TrackFilter'
import { TrackSection } from './TrackSection'
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
          {({ roadmap: { tracks } }) => (
            <>
              <HeatmapSection tracks={tracks} />
              <WeeklySection />
              {tracks.length > 1 && (
                <>
                  <TrackSection tracks={tracks} />
                  <TrackFilter tracks={tracks} />
                </>
              )}
              <PhaseSection tracks={tracks} />
              <SessionsSection tracks={tracks} />
            </>
          )}
        </RoadmapGate>
      </div>
    </>
  )
}
