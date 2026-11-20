import { useEffect, useState } from 'react'

/**
 * La hora actual, refrescada cada `intervalMs` mientras `enabled`.
 * Solo sirve para volver a pintar: el tiempo del temporizador se calcula siempre desde
 * la hora de inicio guardada, así que no importa si el navegador frena el intervalo.
 */
export function useNow(enabled: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled) return
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, intervalMs)
    // Al volver a la app (tras bloquear el móvil) se actualiza de inmediato.
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [enabled, intervalMs])

  return now
}
