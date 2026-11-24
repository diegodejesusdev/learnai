import { rowClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import type { TrackResults } from './studyTargets'

interface TargetResultsProps {
  groups: readonly TrackResults[]
  selectedKey: string | undefined
  onSelect: (key: string) => void
}

/** Resultados del buscador, agrupados por ruta. */
export function TargetResults({ groups, selectedKey, onSelect }: TargetResultsProps) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.trackId} className="flex flex-col gap-1.5">
          <p aria-hidden className="text-sm font-bold">
            {group.title}
          </p>
          <ul
            aria-label={`Resultados en ${group.title}`}
            className="divide-y divide-border border-y border-border"
          >
            {group.results.map((target) => (
              <li key={target.key}>
                <button
                  type="button"
                  onClick={() => onSelect(target.key)}
                  className={cn(
                    rowClasses,
                    'flex min-h-14 w-full flex-col items-start justify-center px-1 py-3 text-left',
                    target.key === selectedKey && 'text-accent',
                  )}
                >
                  <span className="font-semibold">{target.title}</span>
                  <span className="text-sm text-fg-muted">{target.phaseContext}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
