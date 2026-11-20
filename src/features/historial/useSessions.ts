import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { invalidateSessionQueries, studySessionsKey } from '@/lib/sessionQueries'
import { dayQuery } from './sessionFilters'
import {
  deleteSession,
  fetchLatestSession,
  fetchSession,
  fetchSessionPage,
  SESSION_PAGE_SIZE,
  updateSession,
  type SessionQuery,
  type SessionUpdate,
} from './sessionsApi'

/**
 * Lista paginada: «Cargar más» pide las 20 siguientes. Al cambiar los filtros se sigue viendo
 * la lista anterior (atenuada) hasta que llega la nueva.
 */
export function useSessionList(query: SessionQuery) {
  return useInfiniteQuery({
    queryKey: [...studySessionsKey, 'list', query],
    queryFn: ({ pageParam }) => fetchSessionPage(query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < SESSION_PAGE_SIZE ? undefined : pages.length * SESSION_PAGE_SIZE,
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}

/** Sesiones de un día de Bogotá. Solo se piden si ese día tiene alguna. */
export function useDaySessions(day: string, enabled: boolean) {
  return useQuery({
    queryKey: [...studySessionsKey, 'day', day],
    queryFn: () => fetchSessionPage(dayQuery(day), 0, 100),
    enabled,
    staleTime: 0,
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: [...studySessionsKey, 'one', id],
    queryFn: () => fetchSession(id),
    staleTime: 0,
  })
}

/** La sesión más reciente (para «Seguir estudiando»). */
export function useLatestSession() {
  return useQuery({
    queryKey: [...studySessionsKey, 'latest'],
    queryFn: fetchLatestSession,
    staleTime: 0,
  })
}

export function useUpdateSession(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    // Editar y borrar necesitan conexión: sin ella fallan enseguida en vez de esperar.
    networkMode: 'always',
    mutationFn: (update: SessionUpdate) => updateSession(id, update),
    onSettled: () => invalidateSessionQueries(queryClient),
  })
}

export function useDeleteSession(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    mutationFn: () => deleteSession(id),
    onSuccess: () => queryClient.removeQueries({ queryKey: [...studySessionsKey, 'one', id] }),
    onSettled: () => invalidateSessionQueries(queryClient),
  })
}
