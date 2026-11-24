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
      <div className="flex max-w-xl divide-x divide-control rounded-xs border border-control bg-surface">
        {STATUS_FILTERS.map((filter) => (
          <label key={filter} className="min-w-0 flex-auto">
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
                'flex min-h-16 cursor-pointer flex-col-reverse justify-center px-2.5 text-xs font-semibold whitespace-nowrap text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg sm:px-4 sm:text-sm',
                'peer-checked:bg-action peer-checked:text-action-fg peer-checked:hover:bg-action',
                'peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-5 peer-focus-visible:outline-current',
              )}
            >
              {filterLabels[filter]}
              <span className="text-xl font-extrabold tracking-tight tabular-nums">
                {counts[filter]}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
