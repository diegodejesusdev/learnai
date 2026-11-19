import { Check } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { demoChecklistDone } from '@/data/demo'
import type { ChecklistItem } from '@/types/curriculum'

export function ChecklistSection({ items }: { items: readonly ChecklistItem[] }) {
  // Estado local de ejemplo; se guarda en checklist_progress desde la fase 3.
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set(demoChecklistDone))

  function toggle(id: string) {
    setDone((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Section title="Checklist final" description={`${done.size} de ${items.length} logros`}>
      <Card className="p-2 sm:p-2">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-2 py-3 hover:bg-surface-muted">
                <input
                  type="checkbox"
                  checked={done.has(item.id)}
                  onChange={() => toggle(item.id)}
                  className="peer sr-only"
                />
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-border text-transparent peer-checked:border-done peer-checked:bg-done peer-checked:text-surface peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span className="text-sm peer-checked:text-fg-muted peer-checked:line-through">
                  {item.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}
