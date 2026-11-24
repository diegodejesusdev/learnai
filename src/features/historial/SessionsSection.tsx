import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import type { Track } from '@/lib/roadmap'
import { ExportCsvButton } from './ExportCsvButton'
import { SessionFiltersForm } from './SessionFiltersForm'
import { SessionList } from './SessionList'
import { hasFilters, toSessionQuery } from './sessionFilters'
import { useSessionFilters } from './useSessionFilters'

export function SessionsSection({ tracks }: { tracks: readonly Track[] }) {
  const [filters, setFilters] = useSessionFilters()

  return (
    <Section
      title="Sesiones"
      description="De la más reciente a la más antigua. Toca una para editarla o borrarla."
      action={<ExportCsvButton tracks={tracks} />}
    >
      <Card>
        <SessionFiltersForm filters={filters} tracks={tracks} onChange={setFilters} />
      </Card>
      <SessionList
        query={toSessionQuery(filters, tracks)}
        tracks={tracks}
        filtered={hasFilters(filters)}
      />
    </Section>
  )
}
