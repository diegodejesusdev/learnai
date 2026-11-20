import { RefreshCw, X } from 'lucide-react'
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/lib/toast'

/** Cada cuánto se pregunta al servidor si hay una versión nueva (además de al abrir la app). */
const UPDATE_CHECK_MS = 60 * 60 * 1000

/**
 * Registra el service worker (la app abre sin conexión) y avisa cuando hay una versión nueva.
 * La versión nueva no se instala sola: «Actualizar» la activa y recarga la página.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_MS)
    },
  })

  useEffect(() => {
    if (!offlineReady) return
    toast.success('LearnAI quedó guardada en este dispositivo: ya abre sin conexión.')
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady])

  if (!needRefresh) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 lg:bottom-6 lg:pl-64">
      <div
        role="alertdialog"
        aria-labelledby="update-title"
        className="pointer-events-auto flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-4 shadow-lg"
      >
        <div className="flex items-start gap-2">
          <p id="update-title" className="flex-1 text-sm font-medium">
            Hay una versión nueva de LearnAI.
          </p>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setNeedRefresh(false)}
            className="-m-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        <Button onClick={() => void updateServiceWorker(true)}>
          <RefreshCw className="size-4" />
          Actualizar
        </Button>
      </div>
    </div>
  )
}
