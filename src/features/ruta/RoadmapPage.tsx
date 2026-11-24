import { Route } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ChecklistSection } from './ChecklistSection'
import { NextTopicCard } from './NextTopicCard'
import { OverviewCard } from './OverviewCard'
import { PhaseList } from './PhaseList'
import { RoadmapGate, type RoadmapData } from './RoadmapGate'
import { TrackSelector } from './TrackSelector'
import { useShownTrack } from './useShownTrack'

const PANEL_ID = 'ruta-elegida'

function RoadmapView({ roadmap, progress, activeTrack }: RoadmapData) {
  const { tracks } = roadmap
  const [track, showTrack] = useShownTrack(tracks, activeTrack)
  const panel =
    tracks.length > 1 ? { id: PANEL_ID, role: 'tabpanel', 'aria-label': track.title } : {}

  return (
    <div className="flex flex-col gap-6">
      <TrackSelector tracks={tracks} value={track.id} onChange={showTrack} panelId={PANEL_ID} />
      <div {...panel} className="flex flex-col gap-8">
        {track.phases.length === 0 ? (
          <EmptyState
            icon={Route}
            title="Esta ruta está vacía"
            description="Carga su contenido con npm run seed."
          />
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <p className="text-pretty text-fg-muted">{track.goal}</p>
              <OverviewCard track={track} progress={progress} />
              <NextTopicCard track={track} progress={progress} />
            </div>
            <PhaseList track={track} progress={progress} />
            <ChecklistSection track={track} progress={progress} />
          </>
        )}
      </div>
    </div>
  )
}

export function RoadmapPage() {
  return (
    <>
      <PageHeader title="Ruta" />
      <RoadmapGate>{(data) => <RoadmapView {...data} />}</RoadmapGate>
    </>
  )
}
