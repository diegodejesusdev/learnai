import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useEffect, type ReactNode } from 'react'
import { AuthProvider } from '@/features/acceso/AuthProvider'
import { queryClient } from '@/lib/queryClient'
import { registerOfflineMutations } from './offlineMutations'
import { persistOptions, saveCacheNow } from './persistence'
import { ThemeProvider } from './ThemeProvider'

registerOfflineMutations(queryClient)

/** Al abrir la app con cambios en cola (y conexión), se suben y luego se refresca todo. */
function resumeQueue() {
  void queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries())
}

/** Al salir de la app (página oculta o cerrada), la caché y la cola se guardan enseguida. */
function useSaveOnLeave() {
  useEffect(() => {
    const save = () => saveCacheNow(queryClient)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save()
    }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}

export function Providers({ children }: { children: ReactNode }) {
  useSaveOnLeave()
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={resumeQueue}
    >
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  )
}
