import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

interface LoadingStateProps {
  label?: string
  /** Ocupa toda la pantalla (antes de saber si hay sesión). */
  fullScreen?: boolean
}

export function LoadingState({ label = 'Cargando…', fullScreen = false }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-center gap-2 text-sm text-fg-muted',
        fullScreen ? 'min-h-dvh' : 'py-12',
      )}
    >
      <Spinner className="text-meter" />
      {label}
    </div>
  )
}
