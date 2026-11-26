import { readdir } from 'node:fs/promises'
import { extname, join, sep } from 'node:path'

// Las imágenes de content/<ruta>/<fase>/img/ pasan al build como lessons/<ruta>/<fase>/img/:
// las copia el plugin de vite.config.ts, con estas funciones (que se prueban sin Vite).

export interface LessonImageFile {
  /** Archivo en content/. */
  source: string
  /** Dónde queda en el build, sin barra inicial: lessons/cloud/cl-f0/img/a.svg */
  url: string
}

const TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export function imageContentType(file: string): string {
  return TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream'
}

const isImage = (file: string) => extname(file).toLowerCase() in TYPES

/** Todas las imágenes de content/. Sin carpeta, ninguna. */
export async function listLessonImages(contentDir: string): Promise<LessonImageFile[]> {
  const files = await readdir(contentDir, { recursive: true }).catch((error: unknown) => {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return []
    throw error
  })
  return files
    .map((file) => file.split(sep))
    .filter((parts) => parts.length === 4 && parts[2] === 'img' && isImage(parts[3] ?? ''))
    .map((parts) => ({ source: join(contentDir, ...parts), url: `lessons/${parts.join('/')}` }))
    .sort((a, b) => a.url.localeCompare(b.url))
}

const DEV_URL = /^\/lessons\/([\w-]+)\/([\w-]+)\/img\/([\w.-]+)$/

/** En desarrollo: el archivo de content/ que corresponde a esa dirección. null si no es una imagen. */
export function contentFileForUrl(contentDir: string, pathname: string): string | null {
  const [, track, phase, name] = DEV_URL.exec(pathname) ?? []
  if (!track || !phase || !name || name.includes('..') || !isImage(name)) return null
  return join(contentDir, track, phase, 'img', name)
}
