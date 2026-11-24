import type { KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface TabOption<T extends string> {
  value: T
  label: string
}

interface TabsProps<T extends string> {
  label: string
  options: readonly TabOption<T>[]
  value: T
  onChange: (value: T) => void
  /** id del elemento con role="tabpanel" que cambia con la pestaña. */
  panelId: string
}

/** Pestañas: solo la activa entra en el orden del tabulador; las flechas pasan de una a otra. */
export function Tabs<T extends string>({ label, options, value, onChange, panelId }: TabsProps<T>) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = options.findIndex((option) => option.value === value)
    const last = options.length - 1
    const next = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[event.key]
    const option = next === undefined ? undefined : options[next]
    if (next === undefined || !option) return
    event.preventDefault()
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
    onChange(option.value)
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex gap-1 border-b border-border"
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              '-mb-px min-h-11 border-b-2 px-4 text-sm font-medium transition-colors',
              selected ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
