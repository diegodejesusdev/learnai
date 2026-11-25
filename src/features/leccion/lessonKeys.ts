// Claves de TanStack Query de las lecciones. Las dos del contenido no van en la copia de
// localStorage (src/app/persistence.ts): el texto se guarda en IndexedDB (lessonStore.ts).

/** Qué temas tienen lección. */
export const lessonIndexKey = ['lesson-index'] as const
/** Qué has leído. */
export const lessonProgressKey = ['lesson-progress'] as const
/** Clave propia: la cola sin conexión sabe qué función reanudar (offlineMutations.ts). */
export const saveLessonKey = [...lessonProgressKey, 'save'] as const

/** El contenido que llega de Supabase. */
export const lessonKey = (topicId: string) => ['lesson', topicId] as const

/** Lo que hay guardado en el dispositivo. */
export const savedLessonsKey = ['lesson-saved'] as const
export const savedLessonKey = (topicId: string) => [...savedLessonsKey, 'content', topicId] as const
export const savedHashesKey = (topicIds: readonly string[]) =>
  [...savedLessonsKey, 'hashes', ...topicIds] as const
