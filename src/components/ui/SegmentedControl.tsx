import type { LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
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
      <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
          <label key={optionValue} className="min-w-0 flex-1">
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
                'flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-lg px-1.5 text-sm font-medium whitespace-nowrap text-fg-muted transition-colors',
                'peer-checked:bg-surface-raised peer-checked:text-fg peer-checked:shadow-sm',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
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
