import { Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'
import { formatShortDate } from '@/lib/dates'
import { checklistDone, checklistDoneCount } from './progressModel'
import type { RoadmapData } from './RoadmapGate'
import { useSetChecklistItem } from './useProgress'

export function ChecklistSection({ roadmap, progress }: RoadmapData) {
  const setItem = useSetChecklistItem()
  const items = roadmap.checklist

  return (
    <Section
      title="Checklist final"
      description={`${checklistDoneCount(progress)} de ${items.length} logros`}
      className="scroll-mt-20"
    >
      <Card className="p-2 sm:p-2">
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const done = checklistDone(progress, item.id)
            return (
              <li key={item.id}>
                <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-2 py-3 hover:bg-surface-muted">
                  <input
                    type="checkbox"
                    checked={Boolean(done)}
                    onChange={(event) =>
                      setItem.mutate({ itemId: item.id, done: event.target.checked })
                    }
                    className="peer sr-only"
                  />
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-border text-transparent peer-checked:border-done peer-checked:bg-done peer-checked:text-surface peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className={cn('text-sm', done && 'text-fg-muted')}>{item.text}</span>
                    {done?.done_at && (
                      <span className="text-xs text-done">
                        Logrado el {formatShortDate(done.done_at)}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </Card>
    </Section>
  )
}
