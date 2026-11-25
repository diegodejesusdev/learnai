import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Section } from '@/components/ui/Section'
import { findTrack, phaseLabel, type Track } from '@/lib/roadmap'
import { MinutesBars } from './MinutesBars'
import { useSessionFilters } from './useSessionFilters'
import { usePhaseTotals } from './useStudyStats'

/** Minutos por fase de la ruta filtrada o, sin filtro, de cada ruta por separado. */
export function PhaseSection({ tracks }: { tracks: readonly Track[] }) {
  const totals = usePhaseTotals()
  const [filters] = useSessionFilters()
  const filtered = findTrack(tracks, filters.trackId)

  let content
  if (totals.isError) {
    content = (
      <ErrorState
        title="No pudimos cargar el tiempo por fase"
        onRetry={() => void totals.refetch()}
      />
    )
  } else if (!totals.data) {
    content = <LoadingState />
  } else {
    const byPhase = new Map(totals.data.map((total) => [total.phaseId, total]))
    const shown = filtered ? [filtered] : tracks
    content = shown.map((track) => (
      <div key={track.id} className="flex min-w-0 flex-col gap-3">
        {tracks.length > 1 && <h3 className="text-lg font-bold tracking-tight">{track.title}</h3>}
        <MinutesBars
          caption={`Minutos por fase · ${track.title}`}
          column="Fase"
          // Todas las fases, aunque no tengan tiempo: así se ve en cuáles falta estudiar.
          rows={track.phases.map((phase) => ({
            label: phaseLabel(phase),
            title: phase.title,
            name: `${phaseLabel(phase)} · ${phase.title}`,
            minutes: byPhase.get(phase.id)?.minutes ?? 0,
            sessions: byPhase.get(phase.id)?.sessions ?? 0,
          }))}
        />
      </div>
    ))
    if (shown.length > 1) {
      content = (
        <div className="flex flex-col gap-5 wide:grid wide:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] wide:gap-x-14">
          {content}
        </div>
      )
    }
  }

  return (
    <Section
      title="Minutos por fase"
      description="Todo tu historial. Las sesiones del proyecto suman a su fase."
    >
      {content}
    </Section>
  )
}
