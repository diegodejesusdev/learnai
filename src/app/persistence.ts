import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { dehydrate, type DehydrateOptions, type QueryClient } from '@tanstack/react-query'
import type {
  PersistedClient,
  PersistQueryClientOptions,
} from '@tanstack/react-query-persist-client'
import { CACHE_MAX_AGE } from '@/lib/queryClient'

// Copia de la caché de TanStack Query en el dispositivo (localStorage): la ruta, tus notas,
// el progreso y el historial se ven sin conexión, y la cola de cambios pendientes sobrevive
// a cerrar la app. Al cerrar sesión, AuthProvider vacía la caché y esta copia con ella.

/** Cambiarlo invalida las copias guardadas (p. ej. si cambia la forma de los datos). */
const CACHE_VERSION = 'v1'
const CACHE_KEY = 'learnai-cache'

// En modo privado o sin espacio, localStorage puede fallar: la app sigue, solo sin copia.
const storage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Sin espacio: se intenta de nuevo con el próximo cambio.
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // nada que hacer
    }
  },
}

const dehydrateOptions: DehydrateOptions = {
  // No se guardan las conversaciones del tutor (sin conexión no funciona) ni el temporizador
  // activo (ya tiene su propia copia local, que se reconcilia con Supabase: timerStorage.ts).
  shouldDehydrateQuery: (query) =>
    query.state.status === 'success' &&
    query.queryKey[0] !== 'tutor' &&
    query.queryKey[0] !== 'active-timer',
  // La cola: cambios en pausa por falta de conexión. Los del temporizador (iniciar, pausar…)
  // no hacen falta: su copia local se sube sola al volver (reconcileTimer).
  shouldDehydrateMutation: (mutation) =>
    mutation.state.isPaused && mutation.options.mutationKey?.[0] !== 'active-timer',
}

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createAsyncStoragePersister({ storage, key: CACHE_KEY, throttleTime: 100 }),
  maxAge: CACHE_MAX_AGE,
  buster: CACHE_VERSION,
  dehydrateOptions,
}

/**
 * Guarda la caché y la cola ya mismo, sin esperar. Se llama al ocultar o cerrar la página
 * (salir de la app en el móvil): un cambio hecho sin conexión justo antes no se pierde.
 * Mismo formato que el persister, así se recupera igual al abrir.
 */
export function saveCacheNow(queryClient: QueryClient): void {
  const persisted: PersistedClient = {
    buster: CACHE_VERSION,
    timestamp: Date.now(),
    clientState: dehydrate(queryClient, dehydrateOptions),
  }
  storage.setItem(CACHE_KEY, JSON.stringify(persisted))
}
