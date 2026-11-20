import type { ReactNode } from 'react'

interface FieldProps {
  id: string
  label: string
  hint?: string
  /** Si hay error, se muestra en rojo en lugar de la ayuda. */
  error?: string | null
  children: ReactNode
}

/** Etiqueta + control + ayuda o error. Lo usan TextField, TextAreaField y SelectField. */
export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-hint`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
