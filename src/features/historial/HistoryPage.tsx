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
      <div className="flex flex-col gap-14">
        <HistorySummary />
        <RoadmapGate>
          {({ roadmap: { tracks } }) => (
            <>
              <HeatmapSection tracks={tracks} />
              {tracks.length > 1 ? (
                <>
                  <div className="flex flex-col gap-14 wide:grid wide:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] wide:gap-x-14">
                    <WeeklySection />
                    <TrackSection tracks={tracks} />
                  </div>
                  <TrackFilter tracks={tracks} />
                </>
              ) : (
                <WeeklySection />
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
