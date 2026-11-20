import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import type { ProgressStatus } from '@/types/progress'
import {
  fetchProgress,
  fetchTopicMinutes,
  saveChecklistItem,
  saveProject,
  saveTopicNotes,
  saveTopicStatus,
  type ProgressSnapshot,
  type ProjectPatch,
} from './progressApi'
import { withChecklistItem, withProject, withTopicNotes, withTopicStatus } from './progressModel'

export const progressKey = ['progress'] as const

/**
 * staleTime 0: cada vez que vuelves a la app (o a la pestaña) se vuelve a pedir el progreso,
 * así ves al instante lo que cambiaste en otro dispositivo.
 */
export function useProgress() {
  return useQuery({ queryKey: progressKey, queryFn: fetchProgress, staleTime: 0 })
}

export function useTopicMinutes(topicId: string) {
  return useQuery({
    queryKey: ['topic-minutes', topicId],
    queryFn: () => fetchTopicMinutes(topicId),
    staleTime: 0,
  })
}

interface ProgressMutationOptions<TVariables> {
  save: (variables: TVariables) => Promise<void>
  /** Aplica el cambio sobre la caché antes de que responda el servidor. */
  apply: (snapshot: ProgressSnapshot, variables: TVariables, now: string) => ProgressSnapshot
  /** Aviso si falla. null = el componente muestra el error (p. ej. el autoguardado de notas). */
  errorMessage: string | null
}

/** Mutación optimista: se ve al instante y, si falla, se revierte y avisa. */
function useProgressMutation<TVariables>({
  save,
  apply,
  errorMessage,
}: ProgressMutationOptions<TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: progressKey,
    mutationFn: save,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: progressKey })
      const previous = queryClient.getQueryData<ProgressSnapshot>(progressKey)
      if (previous) {
        queryClient.setQueryData(progressKey, apply(previous, variables, new Date().toISOString()))
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(progressKey, context.previous)
      if (errorMessage) toast.error(errorMessage)
    },
    onSettled: () => {
      // Con varios cambios seguidos, se refresca al terminar el último (evita parpadeos).
      if (queryClient.isMutating({ mutationKey: progressKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey: progressKey })
      }
    },
  })
}

export function useSetTopicStatus() {
  return useProgressMutation<{ topicId: string; status: ProgressStatus }>({
    save: ({ topicId, status }) => saveTopicStatus(topicId, status),
    apply: (snapshot, { topicId, status }, now) => withTopicStatus(snapshot, topicId, status, now),
    errorMessage: 'No se pudo cambiar el estado del tema. Se restauró el anterior.',
  })
}

export function useSaveTopicNotes() {
  return useProgressMutation<{ topicId: string; notes: string }>({
    save: ({ topicId, notes }) => saveTopicNotes(topicId, notes),
    apply: (snapshot, { topicId, notes }) => withTopicNotes(snapshot, topicId, notes),
    errorMessage: null,
  })
}

export function useSaveProject(errorMessage: string | null) {
  return useProgressMutation<{ phaseId: string; patch: ProjectPatch }>({
    save: ({ phaseId, patch }) => saveProject(phaseId, patch),
    apply: (snapshot, { phaseId, patch }, now) => withProject(snapshot, phaseId, patch, now),
    errorMessage,
  })
}

export function useSetChecklistItem() {
  return useProgressMutation<{ itemId: string; done: boolean }>({
    save: ({ itemId, done }) => saveChecklistItem(itemId, done),
    apply: (snapshot, { itemId, done }, now) => withChecklistItem(snapshot, itemId, done, now),
    errorMessage: 'No se pudo guardar la checklist. Se restauró el estado anterior.',
  })
}
