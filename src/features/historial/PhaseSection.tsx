import { lazy, Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Section } from '@/components/ui/Section'
import { formatDuration } from '@/lib/dates'
import { phaseLabel } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import { ChartDataTable } from './ChartParts'
import { usePhaseTotals } from './useStudyStats'

const PhaseMinutesChart = lazy(() =>
  import('./PhaseMinutesChart').then((module) => ({ default: module.PhaseMinutesChart })),
)

export function PhaseSection({ phases }: { phases: readonly Phase[] }) {
  const totals = usePhaseTotals()

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
    // Todas las fases, aunque no tengan tiempo: así se ve en cuáles falta estudiar.
    const rows = phases.map((phase) => ({
      label: phaseLabel(phase),
      title: phase.title,
      minutes: byPhase.get(phase.id)?.minutes ?? 0,
      sessions: byPhase.get(phase.id)?.sessions ?? 0,
    }))
    content = (
      <Card className="flex flex-col gap-2">
        <Suspense fallback={<div style={{ height: rows.length * 36 }} />}>
          <PhaseMinutesChart rows={rows} />
        </Suspense>
        <ChartDataTable
          caption="Minutos por fase"
          columns={['Fase', 'Tiempo', 'Sesiones']}
          rows={rows.map((row) => [
            `${row.label} · ${row.title}`,
            formatDuration(row.minutes),
            String(row.sessions),
          ])}
        />
      </Card>
    )
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
