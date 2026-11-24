import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

interface FieldProps {
  id: string
  label: string
  hint?: string
  /** La etiqueta hace de título de la sección. */
  large?: boolean
  /** Si hay error, se muestra en rojo en lugar de la ayuda. */
  error?: string | null
  children: ReactNode
}

/** Etiqueta + control + ayuda o error. Lo usan TextField, TextAreaField y SelectField. */
export function Field({ id, label, hint, large = false, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={large ? 'mb-2 text-title' : 'text-sm font-semibold'}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-hint`} className="flex items-start gap-1.5 text-sm font-medium text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
