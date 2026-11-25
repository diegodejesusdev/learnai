import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Lesson } from './lessonApi'

// Lecciones guardadas en el dispositivo (IndexedDB), para leerlas sin conexión. No van en la copia
// de TanStack Query (src/app/persistence.ts): esa está en localStorage, que solo tiene unos 5 MB;
// si se llenara, dejarían de guardarse también los cambios en cola.
// Si el navegador no deja guardar (modo privado, sin espacio), la app sigue sin copia.

interface LessonDb extends DBSchema {
  lessons: { key: string; value: Lesson }
}

let connection: Promise<IDBPDatabase<LessonDb>> | null = null

function open(): Promise<IDBPDatabase<LessonDb>> {
  const forget = () => {
    connection = null
  }
  connection ??= openDB<LessonDb>('learnai-lecciones', 1, {
    upgrade: (db) => void db.createObjectStore('lessons', { keyPath: 'topicId' }),
    // El navegador cerró la conexión (pasa en iPhone): la próxima vez se abre otra.
    terminated: forget,
  }).catch((error: unknown) => {
    forget()
    throw error
  })
  return connection
}

/** null si no está guardada (o no se pudo leer). */
export async function readSavedLesson(topicId: string): Promise<Lesson | null> {
  try {
    return (await (await open()).get('lessons', topicId)) ?? null
  } catch {
    return null
  }
}

/** false si el navegador no deja guardarlas. Se guardan todas o ninguna. */
export async function saveLessons(lessons: readonly Lesson[]): Promise<boolean> {
  try {
    const tx = (await open()).transaction('lessons', 'readwrite')
    await Promise.all([...lessons.map((lesson) => tx.store.put(lesson)), tx.done])
    return true
  } catch {
    return false
  }
}

/** La versión (hash) guardada de cada uno de esos temas. Sin copia, no aparece. */
export async function savedHashes(
  topicIds: readonly string[],
): Promise<Partial<Record<string, string>>> {
  const saved = await Promise.all(topicIds.map(readSavedLesson))
  return Object.fromEntries(
    saved.flatMap((lesson) => (lesson ? [[lesson.topicId, lesson.hash]] : [])),
  )
}

/** Al cerrar sesión: en el dispositivo no queda nada. */
export async function clearSavedLessons(): Promise<void> {
  try {
    await (await open()).clear('lessons')
  } catch {
    // nada que borrar
  }
}
