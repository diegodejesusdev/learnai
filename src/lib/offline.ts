import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

// Funcionamiento sin conexión (docs/SPEC.md §2):
//  - Las consultas se guardan en el dispositivo (src/app/persistence.ts) y se ven sin internet.
//  - Los cambios sin conexión quedan en una cola: las mutaciones de TanStack Query se pausan,
//    se guardan con la caché y se reanudan al volver la conexión (src/app/offlineMutations.ts).

/**
 * Los cambios de progreso, notas, ajustes y sesiones manuales van en la misma fila: al volver
 * la conexión llegan a Supabase en el orden en que los hiciste.
 */
export const syncScope = { id: 'sync' }

/** true si hay conexión (según el navegador). Se actualiza al conectarse o desconectarse. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  )
}

/**
 * El error es de red (no llegó a Supabase), no una respuesta de error del servidor.
 * supabase-js devuelve el fallo del fetch como mensaje: «Failed to fetch» (Chrome),
 * «NetworkError…» (Firefox) o «Load failed» (Safari).
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  const message =
    typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message)
}
