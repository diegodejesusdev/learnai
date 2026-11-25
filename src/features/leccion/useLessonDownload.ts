import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import { fetchLessons } from './lessonApi'
import { lessonKey, savedHashesKey, savedLessonsKey } from './lessonKeys'
import { downloadState, type DownloadState } from './lessonModel'
import { savedHashes, saveLessons } from './lessonStore'
import { useLessonIndex } from './useLesson'

/** El navegador no deja guardar (modo privado, sin espacio). */
class LessonStorageError extends Error {}

/** Pide al navegador que no borre lo guardado cuando le falte espacio. Si no quiere, da igual. */
async function keepStorage(): Promise<void> {
  // Opcional: no existe sin HTTPS.
  const storage = navigator.storage as StorageManager | undefined
  await storage?.persist().catch(() => false)
}

/** Qué lecciones de la fase están en el dispositivo. null mientras no se sabe. */
export function useDownloadState(topicIds: readonly string[]): DownloadState | null {
  const index = useLessonIndex()
  const saved = useQuery({
    queryKey: savedHashesKey(topicIds),
    queryFn: () => savedHashes(topicIds),
    networkMode: 'always',
    staleTime: 0,
  })
  return index.data && saved.data ? downloadState(topicIds, index.data, saved.data) : null
}

/** Guarda en el dispositivo las lecciones de esos temas. Exige conexión: falla enseguida sin ella. */
export function useDownloadLessons() {
  const queryClient = useQueryClient()
  return useMutation({
    networkMode: 'always',
    mutationFn: async (topicIds: readonly string[]) => {
      const lessons = await fetchLessons(topicIds)
      if (!(await saveLessons(lessons))) throw new LessonStorageError()
      await keepStorage()
      return lessons
    },
    onSuccess: (lessons) => {
      for (const lesson of lessons) queryClient.setQueryData(lessonKey(lesson.topicId), lesson)
      toast.success(
        lessons.length === 1
          ? 'La lección quedó en este dispositivo.'
          : `Las ${lessons.length} lecciones quedaron en este dispositivo.`,
      )
    },
    onError: (error) =>
      toast.error(
        error instanceof LessonStorageError
          ? 'Este navegador no deja guardar las lecciones. Revisa el espacio libre o sal del modo privado.'
          : 'No se pudo descargar la fase. Revisa tu conexión e inténtalo de nuevo.',
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: savedLessonsKey }),
  })
}
