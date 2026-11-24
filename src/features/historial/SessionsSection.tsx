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
      <div className="flex flex-col gap-5 wide:grid wide:grid-cols-[17rem_minmax(0,1fr)] wide:items-start wide:gap-x-14">
        <div className="wide:sticky wide:top-[calc(2rem+var(--banner-height,0px))]">
          <SessionFiltersForm filters={filters} tracks={tracks} onChange={setFilters} />
        </div>
        <SessionList
          query={toSessionQuery(filters, tracks)}
          tracks={tracks}
          filtered={hasFilters(filters)}
        />
      </div>
    </Section>
  )
}
