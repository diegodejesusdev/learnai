import { Search } from 'lucide-react'
import { useId, useState } from 'react'
import { fieldControlClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import { searchByTrack, type StudyTarget } from './studyTargets'
import { TargetResults } from './TargetResults'

export interface TargetSearchProps {
  targets: readonly StudyTarget[]
  selected: StudyTarget | undefined
  onSelect: (key: string) => void
}

/** Buscador de temas y proyectos por nombre, en todas las rutas. */
export function TargetSearch({ targets, selected, onSelect }: TargetSearchProps) {
  const [query, setQuery] = useState('')
  const searchId = useId()
  const groups = searchByTrack(targets, query)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={searchId} className="text-sm font-semibold">
          Cambiar de tema
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-fg-muted" />
          <input
            id={searchId}
            type="search"
            placeholder="Buscar por nombre: webhooks, SQL, n8n…"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={cn(fieldControlClasses, 'min-h-12 pl-10')}
          />
        </div>
      </div>
      {query.trim() !== '' &&
        (groups.length === 0 ? (
          <p className="text-sm text-fg-muted">No hay temas ni proyectos con «{query.trim()}».</p>
        ) : (
          <TargetResults
            groups={groups}
            selectedKey={selected?.key}
            onSelect={(key) => {
              onSelect(key)
              setQuery('')
            }}
          />
        ))}
    </div>
  )
}
