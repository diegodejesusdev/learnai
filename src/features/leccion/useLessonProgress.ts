import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { syncScope } from '@/lib/offline'
import { toast } from '@/lib/toast'
import {
  fetchLessonProgress,
  saveLessonProgress,
  type LessonProgressInput,
  type LessonProgressMap,
} from './lessonApi'
import { lessonProgressKey, saveLessonKey } from './lessonKeys'
import { withLessonProgress } from './lessonModel'

/** staleTime 0: al volver a la app se ve lo que leíste en otro dispositivo. */
export function useLessonProgress() {
  return useQuery({ queryKey: lessonProgressKey, queryFn: fetchLessonProgress, staleTime: 0 })
}

/** Guarda hasta dónde leíste. Optimista y en la cola sin conexión, como el progreso de la ruta. */
export function useSaveLessonProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: saveLessonKey,
    scope: syncScope,
    mutationFn: saveLessonProgress,
    onMutate: async (input: LessonProgressInput) => {
      await queryClient.cancelQueries({ queryKey: lessonProgressKey })
      const previous = queryClient.getQueryData<LessonProgressMap>(lessonProgressKey)
      queryClient.setQueryData(lessonProgressKey, withLessonProgress(previous ?? {}, input))
      return { previous }
    },
    onError: (_error, input, context) => {
      queryClient.setQueryData(lessonProgressKey, context?.previous)
      // El avance a medias no se avisa: se vuelve a guardar más abajo en la página.
      if (input.readAt !== null) toast.error('No se pudo marcar la lección como leída.')
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: lessonProgressKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey: lessonProgressKey })
      }
    },
  })
}
