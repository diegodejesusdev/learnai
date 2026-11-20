import { onlineManager, QueryClient } from '@tanstack/react-query'
import { isNetworkError } from './offline'

// TanStack Query supone que hay conexión al arrancar y solo cambia con los eventos online/offline:
// si abres la app ya sin conexión (modo avión), nunca se enteraría. Se arranca con navigator.onLine.
onlineManager.setEventListener((setOnline) => {
  const update = () => setOnline(navigator.onLine)
  update()
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
  return () => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  }
})

/** Lo guardado en el dispositivo vale una semana (ver src/app/persistence.ts). */
export const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Debe durar al menos lo que la copia guardada; si no, se borraría antes de usarse.
      gcTime: CACHE_MAX_AGE,
      retry: 1,
    },
    mutations: {
      // Si se cae la red a mitad de un envío, se reintenta (y se pausa si queda sin conexión).
      // Un error del servidor no se reintenta.
      retry: (failureCount, error) => isNetworkError(error) && failureCount < 3,
    },
  },
})
