import { LESSON_IMAGES_CACHE } from '@/lib/lessonImages'

// Las imágenes de las lecciones se guardan con ellas, para verlas sin conexión. El service worker
// las sirve desde esta misma caché (vite.config.ts: runtimeCaching) y se llena al ver una imagen,
// al abrir una lección o al descargar una fase.

/** Sin Cache Storage (modo privado, sin HTTPS) no pasa nada: se ven con internet. */
export async function cacheLessonImages(urls: readonly string[]): Promise<void> {
  if (urls.length === 0 || typeof caches === 'undefined') return
  try {
    const cache = await caches.open(LESSON_IMAGES_CACHE)
    await Promise.all(urls.map((url) => cache.add(url).catch(() => undefined)))
  } catch {
    // Sin espacio o sin permiso: la lección se lee igual.
  }
}

export async function clearLessonImages(): Promise<void> {
  if (typeof caches === 'undefined') return
  try {
    await caches.delete(LESSON_IMAGES_CACHE)
  } catch {
    // nada que borrar
  }
}
