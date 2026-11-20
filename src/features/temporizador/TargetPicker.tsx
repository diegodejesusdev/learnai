import { Search } from 'lucide-react'
import { useId, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'
import { fieldControlClasses } from '@/components/ui/styles'
import { searchTargets, type StudyTarget } from './studyTargets'

interface TargetPickerProps {
  targets: readonly StudyTarget[]
  selected: StudyTarget | undefined
  onSelect: (key: string) => void
}

/** Elegir tema o proyecto: el elegido arriba y un buscador por nombre debajo. */
export function TargetPicker({ targets, selected, onSelect }: TargetPickerProps) {
  const [query, setQuery] = useState('')
  const searchId = useId()
  const results = searchTargets(targets, query)

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-1">
        <p className="text-sm text-fg-muted">{selected?.context ?? 'Elige qué vas a estudiar'}</p>
        <p className="text-lg font-semibold">{selected?.title ?? '—'}</p>
      </Card>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={searchId} className="text-sm font-medium">
          Cambiar de tema
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" />
          <input
            id={searchId}
            type="search"
            placeholder="Buscar por nombre: webhooks, n8n, DIAN…"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={cn(fieldControlClasses, 'min-h-11 pl-9')}
          />
        </div>
      </div>
      {query.trim() !== '' &&
        (results.length === 0 ? (
          <p className="text-sm text-fg-muted">No hay temas ni proyectos con «{query.trim()}».</p>
        ) : (
          <ul aria-label="Resultados de la búsqueda" className="flex flex-col gap-1">
            {results.map((target) => (
              <li key={target.key}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(target.key)
                    setQuery('')
                  }}
                  className={cn(
                    'flex min-h-11 w-full flex-col items-start rounded-xl border border-border bg-surface px-3 py-2 text-left hover:bg-surface-muted',
                    target.key === selected?.key && 'border-accent',
                  )}
                >
                  <span className="font-medium">{target.title}</span>
                  <span className="text-xs text-fg-muted">{target.context}</span>
                </button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}
