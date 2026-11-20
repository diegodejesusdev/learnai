import { useEffect } from 'react'

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

/**
 * Mantiene la pantalla encendida mientras `enabled` (Screen Wake Lock API).
 * El navegador suelta el bloqueo al cambiar de app; se vuelve a pedir al regresar.
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isWakeLockSupported()) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) void lock.release()
        else sentinel = lock
      } catch {
        // Denegado (p. ej. ahorro de batería): la app sigue funcionando sin él.
      }
    }

    const onVisibilityChange = () => {
      if (sentinel === null || sentinel.released) void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void sentinel?.release()
    }
  }, [enabled])
}
