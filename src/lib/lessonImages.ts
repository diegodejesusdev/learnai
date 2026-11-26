// Imágenes de las lecciones: diagramas en content/<ruta>/<fase>/img/ que el Markdown llama con una
// ruta relativa (![texto](img/archivo.svg)). Al construir la app se copian a lessons/<ruta>/<fase>/img/
// (vite.config.ts) y al mostrar la lección se reescribe la ruta.
// Sin alias ni navegador: también lo usan scripts/ y vite.config.ts.
import { fenceTracker } from './lessonSections.ts'

/** Cache del service worker y de la descarga de fases: debe ser el mismo en los dos lados. */
export const LESSON_IMAGES_CACHE = 'learnai-lesson-images'

/** Dónde quedan en el build las imágenes de una fase. */
export function lessonAssetBase(trackId: string, phaseId: string): string {
  return `/lessons/${trackId}/${phaseId}/`
}

const IMAGE_PATH = /^img\/[\w.-]+\.(?:svg|png|jpe?g|webp)$/i

/** `img/a.svg` o `./img/a.svg` → `img/a.svg`. null si no es una imagen de la carpeta img/. */
export function localImagePath(src: string): string | null {
  const path = src.trim().replace(/^\.\//, '')
  return IMAGE_PATH.test(path) && !path.includes('..') ? path : null
}

/** La dirección de la imagen en el build. null = no se muestra (externa o de otra carpeta). */
export function resolveLessonImage(src: string, base: string): string | null {
  const path = localImagePath(src)
  return path === null ? null : `${base}${path}`
}

const IMAGE = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g

/** Lo que dice cada ![texto](ruta) de la lección, sin repetir y sin los ejemplos de código. */
export function lessonImageSources(markdown: string): string[] {
  const inCode = fenceTracker()
  const sources = new Set<string>()
  for (const line of markdown.split('\n')) {
    if (inCode(line)) continue
    for (const [, src] of line.matchAll(IMAGE)) if (src) sources.add(src)
  }
  return [...sources]
}

/** Las direcciones del build de las imágenes de la lección, para guardarlas con ella. */
export function lessonImageUrls(markdown: string, base: string): string[] {
  return lessonImageSources(markdown).flatMap((src) => resolveLessonImage(src, base) ?? [])
}
