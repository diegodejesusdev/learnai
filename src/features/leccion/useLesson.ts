import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchLesson, fetchLessonIndex, type Lesson, type LessonInfo } from './lessonApi'
import { lessonImageUrls } from '@/lib/lessonImages'
import { cacheLessonImages } from './lessonImageCache'
import { lessonIndexKey, lessonKey, savedLessonKey, savedLessonsKey } from './lessonKeys'
import { readSavedLesson, saveLessons } from './lessonStore'

/** El contenido cambia poco (solo al correr el seed), pero una lección nueva se ve pronto. */
const CONTENT_STALE_TIME = 5 * 60 * 1000

export function useLessonIndex() {
  return useQuery({
    queryKey: lessonIndexKey,
    queryFn: fetchLessonIndex,
    staleTime: CONTENT_STALE_TIME,
  })
}

export type LessonAvailability =
  | { status: 'available'; info: LessonInfo }
  /** El tema aún no tiene lección. */
  | { status: 'missing' }
  /** Todavía no se sabe (cargando, sin conexión o con error): la página de la lección lo dirá. */
  | { status: 'unknown' }

/** Si el tema tiene lección, sin descargarla. */
export function useLessonAvailability(topicId: string): LessonAvailability {
  const { data: index } = useLessonIndex()
  if (!index) return { status: 'unknown' }
  const info = index[topicId]
  return info ? { status: 'available', info } : { status: 'missing' }
}

export type LessonState =
  | { status: 'ready'; lesson: Lesson }
  | { status: 'loading' }
  /** El tema aún no tiene lección. */
  | { status: 'missing' }
  /** Sin conexión y sin copia en el dispositivo. */
  | { status: 'offline' }
  | { status: 'error'; retry: () => void }

/**
 * La lección: primero la copia del dispositivo (al instante y sin conexión) y, si hay internet, la
 * de Supabase, que además queda guardada.
 */
export function useLesson(topicId: string, assetBase: string): LessonState {
  const queryClient = useQueryClient()
  const availability = useLessonAvailability(topicId)
  const saved = useQuery({
    queryKey: savedLessonKey(topicId),
    queryFn: () => readSavedLesson(topicId),
    networkMode: 'always',
    staleTime: Infinity,
  })
  const remote = useQuery({
    queryKey: lessonKey(topicId),
    queryFn: async () => {
      const lesson = await fetchLesson(topicId)
      // Sin esperar a que se guarde: leer no depende de que el navegador deje guardar.
      if (lesson) {
        void saveLessons([lesson]).then(() =>
          queryClient.invalidateQueries({ queryKey: savedLessonsKey }),
        )
        void cacheLessonImages(lessonImageUrls(lesson.content, assetBase))
      }
      return lesson
    },
    staleTime: CONTENT_STALE_TIME,
  })

  // Lo que dijo Supabase manda: si la lección se quitó, la copia vieja no se muestra.
  const lesson = remote.data === undefined ? saved.data : remote.data
  if (lesson) return { status: 'ready', lesson }
  if (remote.data === null) return { status: 'missing' }
  if (saved.isPending) return { status: 'loading' }
  if (remote.isError) return { status: 'error', retry: () => void remote.refetch() }
  if (remote.fetchStatus !== 'paused') return { status: 'loading' }
  return availability.status === 'missing' ? { status: 'missing' } : { status: 'offline' }
}
