import { useId } from 'react'
import { cn } from '@/lib/cn'
import { tutorModes, type TutorMode } from './tutorModes'

interface ModePickerProps {
  value: TutorMode
  onChange: (value: TutorMode) => void
}

export function ModePicker({ value, onChange }: ModePickerProps) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Modo</legend>
      <div className="grid grid-cols-2 gap-2">
        {tutorModes.map(({ value: mode, label, description, icon: Icon }) => (
          <label key={mode}>
            <input
              type="radio"
              name={name}
              value={mode}
              checked={mode === value}
              onChange={() => onChange(mode)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex h-full min-h-11 cursor-pointer flex-col gap-1 rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-surface-muted',
                'peer-checked:border-accent peer-checked:bg-accent-soft peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="size-4 text-accent" />
                {label}
              </span>
              <span className="text-xs text-fg-muted">{description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
