import type { ReactNode } from 'react'

interface FieldProps {
  id: string
  label: string
  hint?: string
  children: ReactNode
}

/** Etiqueta + control + ayuda. Lo usan TextField, TextAreaField y SelectField. */
export function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
