import { useMutationState } from '@tanstack/react-query'
import { Check, CloudOff, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { useOnline } from '@/lib/offline'
import { nextSyncState, type SyncState } from './syncState'

const SYNCED_VISIBLE_MS = 3000

/** «Sin conexión», «Sincronizando…» o «Sincronizado», en la cabecera y la barra lateral. */
export function ConnectionStatus({ className }: { className?: string }) {
  const online = useOnline()
  const pausedFlags = useMutationState({
    filters: { status: 'pending' },
    select: (mutation) => mutation.state.isPaused,
  })
  const paused = pausedFlags.filter(Boolean).length
  const pending = pausedFlags.length
  const [state, setState] = useState<SyncState>('idle')

  const next = nextSyncState(state, { online, paused, pending })
  if (next !== state) setState(next)

  useEffect(() => {
    if (state !== 'synced') return
    const timeout = setTimeout(() => setState('idle'), SYNCED_VISIBLE_MS)
    return () => clearTimeout(timeout)
  }, [state])

  const label =
    state === 'offline'
      ? // Sin conexión, todo lo pendiente espera (también lo que hace fila detrás de otro cambio).
        pending > 0
        ? `Sin conexión · ${pending} sin subir`
        : 'Sin conexión'
      : state === 'syncing'
        ? 'Sincronizando…'
        : state === 'synced'
          ? 'Sincronizado'
          : ''
  const Icon = state === 'offline' ? CloudOff : state === 'syncing' ? RefreshCw : Check

  return (
    <div role="status" aria-live="polite" className={className}>
      {label && (
        <span
          title={
            state === 'offline'
              ? 'Ves lo último guardado en este dispositivo. Tus cambios se subirán al volver la conexión.'
              : undefined
          }
          className={cn(
            'inline-flex min-h-8 items-center gap-1.5 rounded-xs border px-2.5 text-xs font-semibold',
            state === 'offline'
              ? 'border-chrome-fg bg-chrome-fg text-chrome'
              : 'border-chrome-muted text-chrome-fg',
          )}
        >
          <Icon className={cn('size-4 shrink-0', state === 'syncing' && 'animate-spin')} />
          {label}
        </span>
      )}
    </div>
  )
}
