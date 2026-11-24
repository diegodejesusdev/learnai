import { Check } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { rowClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import { formatShortDate } from '@/lib/dates'
import { checklistDone, checklistDoneCount } from './progressModel'
import type { TrackData } from './RoadmapGate'
import { useSetChecklistItem } from './useProgress'

/** La checklist final de una ruta: cada una tiene la suya. */
export function ChecklistSection({ track, progress }: TrackData) {
  const setItem = useSetChecklistItem()
  const items = track.checklist

  return (
    <Section
      title="Checklist final"
      description={`${checklistDoneCount(progress, items)} de ${items.length} logros`}
      className="scroll-mt-20"
    >
      <ul className="divide-y divide-border border-y border-border">
        {items.map((item) => {
          const done = checklistDone(progress, item.id)
          return (
            <li key={item.id}>
              <label
                className={cn(rowClasses, 'flex min-h-14 cursor-pointer items-start gap-4 py-4')}
              >
                <input
                  type="checkbox"
                  checked={Boolean(done)}
                  onChange={(event) =>
                    setItem.mutate({ itemId: item.id, done: event.target.checked })
                  }
                  className="peer sr-only"
                />
                <span className="flex size-6 shrink-0 items-center justify-center rounded-xs border-2 border-control bg-surface text-transparent peer-checked:border-done peer-checked:bg-done peer-checked:text-done-fg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg">
                  <Check className="size-4" strokeWidth={3.5} />
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className={cn(done && 'text-fg-muted')}>{item.text}</span>
                  {done?.done_at && (
                    <span className="text-sm font-semibold text-fg">
                      Logrado el {formatShortDate(done.done_at)}
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
