import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import { fetchUserSettings, saveUserSettings, type UserSettings } from './settingsApi'

export const settingsKey = ['user-settings'] as const

export function useUserSettings() {
  return useQuery({ queryKey: settingsKey, queryFn: fetchUserSettings, staleTime: 0 })
}

/** Guardado optimista de ajustes. errorMessage null = el componente muestra el error. */
export function useSaveUserSettings(errorMessage: string | null = null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: settingsKey,
    mutationFn: saveUserSettings,
    onMutate: async (patch: Partial<UserSettings>) => {
      await queryClient.cancelQueries({ queryKey: settingsKey })
      const previous = queryClient.getQueryData<UserSettings>(settingsKey)
      if (previous) queryClient.setQueryData(settingsKey, { ...previous, ...patch })
      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(settingsKey, context.previous)
      if (errorMessage) toast.error(errorMessage)
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: settingsKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey: settingsKey })
      }
    },
  })
}
