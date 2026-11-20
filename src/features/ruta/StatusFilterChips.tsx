import { useId } from 'react'
import { cn } from '@/lib/cn'
import type { StatusFilter } from '@/lib/progress'
import { STATUS_FILTERS } from '@/lib/progress'

const filterLabels: Record<StatusFilter, string> = {
  todos: 'Todos',
  pendiente: 'Pendientes',
  en_curso: 'En curso',
  hecho: 'Hechos',
}

interface StatusFilterChipsProps {
  label: string
  value: StatusFilter
  counts: Record<StatusFilter, number>
  onChange: (value: StatusFilter) => void
}

export function StatusFilterChips({ label, value, counts, onChange }: StatusFilterChipsProps) {
  const name = useId()
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <label key={filter}>
            <input
              type="radio"
              name={name}
              value={filter}
              checked={filter === value}
              onChange={() => onChange(filter)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg',
                'peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-soft-fg',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
              )}
            >
              {filterLabels[filter]}
              <span className="text-xs tabular-nums opacity-70">{counts[filter]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
