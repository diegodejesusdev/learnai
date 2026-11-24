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
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.trackId} className="flex flex-col gap-1.5">
          <p aria-hidden className="text-sm font-medium text-fg-muted">
            {group.title}
          </p>
          <ul aria-label={`Resultados en ${group.title}`} className="flex flex-col gap-1">
            {group.results.map((target) => (
              <li key={target.key}>
                <button
                  type="button"
                  onClick={() => onSelect(target.key)}
                  className={cn(
                    'flex min-h-11 w-full flex-col items-start rounded-xl border border-border bg-surface px-3 py-2 text-left hover:bg-surface-muted',
                    target.key === selectedKey && 'border-accent',
                  )}
                >
                  <span className="font-medium">{target.title}</span>
                  <span className="text-xs text-fg-muted">{target.phaseContext}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
