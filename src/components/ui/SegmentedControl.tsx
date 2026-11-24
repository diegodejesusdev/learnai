import { useId, type ComponentType } from 'react'
import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ComponentType<{ className?: string }>
}

interface SegmentedControlProps<T extends string> {
  label: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

/** Grupo de radios nativos con aspecto de botones: las flechas del teclado funcionan solas. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId()
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="grid auto-cols-fr grid-flow-col divide-x divide-control overflow-hidden rounded-control border border-control bg-surface">
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
          <label key={optionValue} className="min-w-0">
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={optionValue === value}
              onChange={() => onChange(optionValue)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex min-h-12 cursor-pointer items-center justify-center gap-1.5 px-1.5 text-sm font-semibold whitespace-nowrap text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg',
                'peer-checked:bg-action peer-checked:text-action-fg peer-checked:hover:bg-action',
                'peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-5 peer-focus-visible:outline-current',
              )}
            >
              {Icon && <Icon className="size-4 shrink-0" />}
              {optionLabel}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
