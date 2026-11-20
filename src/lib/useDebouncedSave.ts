import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Guarda un valor un rato después de la última edición (autoguardado).
 * También guarda de inmediato si sales de la página, cambias de app en el móvil
 * o el componente se desmonta, para no perder lo último que escribiste.
 */
export function useDebouncedSave<T>(save: (value: T) => void, delayMs = 800) {
  const saveRef = useRef(save)
  const timer = useRef<number | undefined>(undefined)
  const pending = useRef<{ value: T } | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    saveRef.current = save
  })

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    const next = pending.current
    pending.current = null
    setIsWaiting(false)
    if (next) saveRef.current(next.value)
  }, [])

  const schedule = useCallback(
    (value: T) => {
      pending.current = { value }
      setIsWaiting(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, delayMs)
    },
    [delayMs, flush],
  )

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  return { schedule, flush, isWaiting }
}
