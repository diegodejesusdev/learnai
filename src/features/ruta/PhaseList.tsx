import { ListFilter } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Section } from '@/components/ui/Section'
import { countByFilter, matchesFilter, phaseProgress, phaseStatus } from '@/lib/progress'
import { PhaseCard } from './PhaseCard'
import { topicStatuses } from './progressModel'
import type { RoadmapData } from './RoadmapGate'
import { StatusFilterChips } from './StatusFilterChips'
import { useStatusFilter } from './useStatusFilter'

export function PhaseList({ roadmap, progress }: RoadmapData) {
  const [filter, setFilter] = useStatusFilter()
  const statuses = topicStatuses(progress)
  const phases = roadmap.phases.map((phase) => ({
    phase,
    progress: phaseProgress(phase, statuses),
    status: phaseStatus(phase, statuses),
  }))
  const visible = phases.filter(({ status }) => matchesFilter(status, filter))

  return (
    <Section title="Fases" description={`${roadmap.phases.length} fases · ${roadmap.title}`}>
      <StatusFilterChips
        label="Filtrar fases por estado"
        value={filter}
        counts={countByFilter(phases.map(({ status }) => status))}
        onChange={setFilter}
      />
      {visible.length === 0 ? (
        <EmptyState icon={ListFilter} title="Ninguna fase con ese estado" />
      ) : (
        <ol className="flex flex-col gap-3">
          {visible.map(({ phase, progress: phaseProgressValue, status }) => (
            <li key={phase.id}>
              <PhaseCard phase={phase} progress={phaseProgressValue} status={status} />
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}
