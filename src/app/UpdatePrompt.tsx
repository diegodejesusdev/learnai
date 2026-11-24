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
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 lg:bottom-6 lg:pl-60">
      <div
        role="alertdialog"
        aria-labelledby="update-title"
        data-surface="dark"
        className="pointer-events-auto flex w-full max-w-md flex-col gap-4 rounded-xs bg-chrome p-4 text-chrome-fg ring-1 ring-border"
      >
        <div className="flex items-start gap-2">
          <p id="update-title" className="flex-1 font-semibold">
            Hay una versión nueva de LearnAI.
          </p>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setNeedRefresh(false)}
            className="-m-3 flex size-11 shrink-0 items-center justify-center rounded-xs text-chrome-muted hover:text-chrome-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        <Button variant="inverse" onClick={() => void updateServiceWorker(true)}>
          <RefreshCw className="size-4" />
          Actualizar
        </Button>
      </div>
    </div>
  )
}
