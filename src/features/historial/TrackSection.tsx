import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Section } from '@/components/ui/Section'
import type { Track } from '@/lib/roadmap'
import { TrackMinutes } from './TrackMinutes'
import { trackTotals } from './trackTotals'
import { usePhaseTotals } from './useStudyStats'

/** Minutos por ruta, de toda la historia. No la cambia el filtro: sirve para compararlas. */
export function TrackSection({ tracks }: { tracks: readonly Track[] }) {
  const totals = usePhaseTotals()

  let content
  if (totals.isError) {
    content = (
      <ErrorState
        title="No pudimos cargar el tiempo por ruta"
        onRetry={() => void totals.refetch()}
      />
    )
  } else if (!totals.data) {
    content = <LoadingState />
  } else {
    content = <TrackMinutes totals={trackTotals(tracks, totals.data)} />
  }

  return (
    <Section
      title="Minutos por ruta"
      description="Todo tu historial. La racha, la meta y las semanas cuentan todas las rutas juntas."
    >
      {content}
    </Section>
  )
}
