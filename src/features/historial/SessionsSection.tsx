import { useSearchParams } from 'react-router'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import type { Phase } from '@/types/curriculum'
import { ExportCsvButton } from './ExportCsvButton'
import { SessionFiltersForm } from './SessionFiltersForm'
import { SessionList } from './SessionList'
import {
  hasFilters,
  readSessionFilters,
  toSessionQuery,
  writeSessionFilters,
  type SessionFilters,
} from './sessionFilters'

export function SessionsSection({ phases }: { phases: readonly Phase[] }) {
  const [params, setParams] = useSearchParams()
  const filters = readSessionFilters(params)

  const changeFilters = (next: SessionFilters) => {
    void setParams(writeSessionFilters(params, next), { replace: true, preventScrollReset: true })
  }

  return (
    <Section
      title="Sesiones"
      description="De la más reciente a la más antigua. Toca una para editarla o borrarla."
      action={<ExportCsvButton phases={phases} />}
    >
      <Card>
        <SessionFiltersForm filters={filters} phases={phases} onChange={changeFilters} />
      </Card>
      <SessionList
        query={toSessionQuery(filters, phases)}
        phases={phases}
        filtered={hasFilters(filters)}
      />
    </Section>
  )
}
