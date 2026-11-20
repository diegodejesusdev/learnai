import type { QueryClient } from '@tanstack/react-query'
import { saveUserSettings, type UserSettings } from '@/features/ajustes/settingsApi'
import { settingsKey } from '@/features/ajustes/useUserSettings'
import {
  saveChecklistItem,
  saveProject,
  saveTopicNotes,
  saveTopicStatus,
  type ProjectPatch,
} from '@/features/ruta/progressApi'
import {
  checklistKey,
  progressKey,
  projectKey,
  topicNotesKey,
  topicStatusKey,
} from '@/features/ruta/useProgress'
import {
  finishActiveTimer,
  recordManualSession,
  type FinishInput,
  type ManualSessionInput,
} from '@/features/temporizador/timerApi'
import {
  finishSessionKey,
  manualSessionKey,
  timerScope,
} from '@/features/temporizador/useActiveTimer'
import { syncScope } from '@/lib/offline'
import { invalidateSessionQueries } from '@/lib/sessionQueries'
import type { ProgressStatus } from '@/types/progress'

/**
 * Cola sin conexión. Los cambios que se hacen sin internet quedan como mutaciones en pausa y se
 * guardan en el dispositivo junto con la caché. Si cierras la app antes de que vuelva la red,
 * al abrirla se reanudan con estas funciones (la mutación guardada solo trae su clave y sus
 * datos). Las sesiones llevan un id del dispositivo: reanudarlas no las duplica.
 */
export function registerOfflineMutations(queryClient: QueryClient): void {
  const refreshProgress = () => queryClient.invalidateQueries({ queryKey: progressKey })
  const refreshSessions = () => {
    void refreshProgress()
    invalidateSessionQueries(queryClient)
  }

  queryClient.setMutationDefaults(topicStatusKey, {
    mutationFn: ({ topicId, status }: { topicId: string; status: ProgressStatus }) =>
      saveTopicStatus(topicId, status),
    scope: syncScope,
    onSettled: refreshProgress,
  })
  queryClient.setMutationDefaults(topicNotesKey, {
    mutationFn: ({ topicId, notes }: { topicId: string; notes: string }) =>
      saveTopicNotes(topicId, notes),
    scope: syncScope,
    onSettled: refreshProgress,
  })
  queryClient.setMutationDefaults(projectKey, {
    mutationFn: ({ phaseId, patch }: { phaseId: string; patch: ProjectPatch }) =>
      saveProject(phaseId, patch),
    scope: syncScope,
    onSettled: refreshProgress,
  })
  queryClient.setMutationDefaults(checklistKey, {
    mutationFn: ({ itemId, done }: { itemId: string; done: boolean }) =>
      saveChecklistItem(itemId, done),
    scope: syncScope,
    onSettled: refreshProgress,
  })
  queryClient.setMutationDefaults(settingsKey, {
    mutationFn: (patch: Partial<UserSettings>) => saveUserSettings(patch),
    scope: syncScope,
    onSettled: () => queryClient.invalidateQueries({ queryKey: settingsKey }),
  })
  queryClient.setMutationDefaults(manualSessionKey, {
    mutationFn: (input: ManualSessionInput) => recordManualSession(input),
    scope: syncScope,
    onSettled: refreshSessions,
  })
  queryClient.setMutationDefaults(finishSessionKey, {
    mutationFn: (input: FinishInput) => finishActiveTimer(input),
    scope: timerScope,
    onSettled: refreshSessions,
  })
}
