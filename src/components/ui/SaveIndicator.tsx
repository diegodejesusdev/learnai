import { CircleAlert, CircleCheck, CloudOff } from 'lucide-react'
import type { SaveStatus } from '@/lib/saveStatus'
import { Spinner } from './Spinner'

interface SaveIndicatorProps {
  status: SaveStatus
  onRetry?: () => void
}

/** «Guardando… / Guardado / Sin conexión / No se guardó» junto a un campo con autoguardado. */
export function SaveIndicator({ status, onRetry }: SaveIndicatorProps) {
  return (
    <span
      aria-live="polite"
      className="inline-flex min-h-5 flex-wrap items-center gap-1.5 text-sm text-fg-muted"
    >
      {status === 'saving' && (
        <>
          <Spinner className="size-4" />
          Guardando…
        </>
      )}
      {status === 'saved' && (
        <>
          <CircleCheck className="size-4 text-done" />
          Guardado
        </>
      )}
      {status === 'offline' && (
        <>
          <CloudOff className="size-4" />
          Sin conexión: se guardará al volver
        </>
      )}
      {status === 'error' && (
        <>
          <CircleAlert className="size-4 text-danger" />
          <span className="font-medium text-danger">No se guardó.</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="-my-3 inline-flex min-h-11 items-center px-1 font-semibold text-fg underline underline-offset-4"
            >
              Reintentar
            </button>
          )}
        </>
      )}
    </span>
  )
}
