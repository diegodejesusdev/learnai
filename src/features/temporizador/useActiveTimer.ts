import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/acceso/AuthContext'
import { progressKey } from '@/features/ruta/useProgress'
import { invalidateSessionQueries } from '@/lib/sessionQueries'
import { toast } from '@/lib/toast'
import {
  deleteActiveTimer,
  fetchActiveTimer,
  finishActiveTimer,
  insertActiveTimer,
  TimerConflictError,
  TimerGoneError,
  updateActiveTimer,
  upsertActiveTimer,
  type FinishInput,
} from './timerApi'
import type { ActiveTimer } from './timerModel'
import { readStoredTimer, reconcileTimer, writeStoredTimer } from './timerStorage'

export const activeTimerKey = ['active-timer'] as const

function useUserId(): string {
  const auth = useAuth()
  if (auth.status !== 'signed_in') throw new Error('El temporizador necesita una sesión iniciada')
  return auth.user.id
}

async function loadActiveTimer(userId: string): Promise<ActiveTimer | null> {
  const server = await fetchActiveTimer()
  const { timer, push } = reconcileTimer(server, readStoredTimer(userId))
  if (push) {
    if (timer) await upsertActiveTimer(timer)
    else await deleteActiveTimer(userId)
  }
  writeStoredTimer({ userId, timer, synced: true, changedAt: new Date().toISOString() })
  return timer
}

/**
 * El temporizador activo. Aparece al instante desde localStorage y se confirma con Supabase:
 * al abrir la app, al volver a ella y cada 30 s mientras haya una sesión.
 */
export function useActiveTimer() {
  const userId = useUserId()
  return useQuery({
    queryKey: activeTimerKey,
    queryFn: () => loadActiveTimer(userId),
    initialData: () => readStoredTimer(userId)?.timer ?? undefined,
    // La copia local se muestra, pero se vuelve a pedir a Supabase enseguida.
    initialDataUpdatedAt: 0,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data ? 30_000 : false),
  })
}

type TimerChange =
  | { kind: 'start'; timer: ActiveTimer }
  | { kind: 'update'; timer: ActiveTimer }
  | { kind: 'discard' }

function clearTimer(queryClient: QueryClient, userId: string) {
  queryClient.setQueryData(activeTimerKey, null)
  writeStoredTimer({ userId, timer: null, synced: true, changedAt: new Date().toISOString() })
}

// Todas las acciones del temporizador van en fila (scope): llegan a Supabase en orden.
const timerScope = { id: 'active-timer' }

/** Iniciar, pausar, reanudar o descartar: se ve al instante y se guarda en Supabase. */
export function useTimerChange() {
  const userId = useUserId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: activeTimerKey,
    scope: timerScope,
    mutationFn: async (change: TimerChange) => {
      if (change.kind === 'start') await insertActiveTimer(change.timer)
      else if (change.kind === 'update') await updateActiveTimer(userId, change.timer)
      else await deleteActiveTimer(userId)
    },
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: activeTimerKey })
      const previous = queryClient.getQueryData<ActiveTimer | null>(activeTimerKey) ?? null
      const next = change.kind === 'discard' ? null : change.timer
      const changedAt = new Date().toISOString()
      queryClient.setQueryData(activeTimerKey, next)
      // synced: false hasta que Supabase confirme (si se cierra la app sin conexión, se sube luego).
      writeStoredTimer({ userId, timer: next, synced: false, changedAt })
      return { previous, changedAt }
    },
    onSuccess: (_data, _change, context) => {
      // Solo se marca sincronizado si no hubo otro cambio local después de este.
      const stored = readStoredTimer(userId)
      if (stored && stored.changedAt === context.changedAt)
        writeStoredTimer({ ...stored, synced: true })
    },
    onError: (error, _change, context) => {
      if (error instanceof TimerGoneError) {
        clearTimer(queryClient, userId)
        toast.error('Esta sesión ya se terminó en otro dispositivo.')
        return
      }
      const previous = context?.previous ?? null
      queryClient.setQueryData(activeTimerKey, previous)
      writeStoredTimer({
        userId,
        timer: previous,
        synced: true,
        changedAt: new Date().toISOString(),
      })
      toast.error(
        error instanceof TimerConflictError
          ? 'Ya tienes una sesión en curso en otro dispositivo.'
          : 'No se pudo guardar el temporizador. Se restauró el estado anterior.',
      )
      void queryClient.invalidateQueries({ queryKey: activeTimerKey })
    },
  })
}

/** Terminar: guarda la sesión en study_sessions y borra el temporizador. */
export function useFinishSession() {
  const userId = useUserId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['finish-session'],
    scope: timerScope,
    mutationFn: (input: FinishInput) => finishActiveTimer(input),
    onSuccess: () => {
      clearTimer(queryClient, userId)
      void queryClient.invalidateQueries({ queryKey: progressKey })
      invalidateSessionQueries(queryClient)
    },
    onError: (error) => {
      if (error instanceof TimerGoneError) {
        clearTimer(queryClient, userId)
        toast.error('Esta sesión ya se guardó o descartó en otro dispositivo.')
      }
    },
  })
}
