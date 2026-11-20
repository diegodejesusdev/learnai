import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/SelectField'
import { TextField } from '@/components/ui/TextField'
import { findPhaseIn, phaseLabel } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'
import { emptyFilters, hasFilters, type SessionFilters } from './sessionFilters'

interface SessionFiltersFormProps {
  filters: SessionFilters
  phases: readonly Phase[]
  onChange: (filters: SessionFilters) => void
}

export function SessionFiltersForm({ filters, phases, onChange }: SessionFiltersFormProps) {
  const phase = findPhaseIn(phases, filters.phaseId)
  const set = (patch: Partial<SessionFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TextField
          label="Desde"
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => set({ from: event.target.value })}
        />
        <TextField
          label="Hasta"
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => set({ to: event.target.value })}
        />
        <div className="col-span-2 sm:col-span-1">
          <SelectField
            label="Fase"
            value={filters.phaseId}
            onChange={(event) => set({ phaseId: event.target.value, targetKey: '' })}
          >
            <option value="">Todas</option>
            {phases.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {phaseLabel(candidate)} · {candidate.title}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <SelectField
            label="Tema"
            value={filters.targetKey}
            disabled={!phase}
            hint={phase ? undefined : 'Primero elige una fase.'}
            onChange={(event) => set({ targetKey: event.target.value })}
          >
            <option value="">Todos</option>
            {phase?.topics.map((topic) => (
              <option key={topic.id} value={`tema:${topic.id}`}>
                {topic.title}
              </option>
            ))}
            {phase && (
              <option value={`proyecto:${phase.id}`}>Proyecto: {phase.project.title}</option>
            )}
          </SelectField>
        </div>
      </div>
      {hasFilters(filters) && (
        <Button variant="ghost" className="self-start" onClick={() => onChange(emptyFilters)}>
          <X className="size-4" />
          Quitar filtros
        </Button>
      )}
    </div>
  )
}
