import { useSyncExternalStore } from 'react'

// «Instalar app» (Ajustes). Chrome y Edge (Android y escritorio) disparan beforeinstallprompt
// cuando la app se puede instalar; se guarda el evento para mostrarlo al tocar el botón.
// Safari en iPhone no tiene ese evento: allí se instala con Compartir → Agregar a inicio.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

/** Se llama al arrancar (main.tsx): el evento puede llegar antes de que se pinte la app. */
export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

export function useCanInstall(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => deferred !== null,
    () => false,
  )
}

/** Abre el diálogo de instalación del navegador. true si la instalaste. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const event = deferred
  await event.prompt()
  const { outcome } = await event.userChoice
  deferred = null
  emit()
  return outcome === 'accepted'
}

/** Ya se está usando la app instalada (pantalla completa, sin barra del navegador). */
export function isStandalone(): boolean {
  const media =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  return media || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export type InstallHelp = 'installed' | 'prompt' | 'ios' | 'unsupported'

/** Qué ofrecer en Ajustes según el navegador. */
export function installHelp(options: {
  standalone: boolean
  canInstall: boolean
  userAgent: string
  maxTouchPoints: number
}): InstallHelp {
  if (options.standalone) return 'installed'
  if (options.canInstall) return 'prompt'
  // El iPad se presenta como Mac; se distingue porque tiene pantalla táctil.
  const ios =
    /iPhone|iPad|iPod/.test(options.userAgent) ||
    (/Macintosh/.test(options.userAgent) && options.maxTouchPoints > 1)
  return ios ? 'ios' : 'unsupported'
}
