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
      className="inline-flex min-h-5 items-center gap-1.5 text-xs text-fg-muted"
    >
      {status === 'saving' && (
        <>
          <Spinner className="size-3.5" />
          Guardando…
        </>
      )}
      {status === 'saved' && (
        <>
          <CircleCheck className="size-3.5 text-done" />
          Guardado
        </>
      )}
      {status === 'offline' && (
        <>
          <CloudOff className="size-3.5" />
          Sin conexión: se guardará al volver
        </>
      )}
      {status === 'error' && (
        <>
          <CircleAlert className="size-3.5 text-danger" />
          <span className="text-danger">No se guardó.</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="font-medium text-accent underline-offset-2 hover:underline"
            >
              Reintentar
            </button>
          )}
        </>
      )}
    </span>
  )
}
