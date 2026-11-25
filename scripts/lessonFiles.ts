import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { basename, join, sep } from 'node:path'
import { normalizeText, parseFrontmatter } from './frontmatter.ts'

/** Una lección por tema: content/<ruta>/<fase>/<id-del-tema>.md. Agregar es copiar el archivo. */
export const CONTENT_DIR = join(import.meta.dirname, '../content')

export interface LessonFile {
  /** Ruta dentro de content/, para los mensajes. */
  file: string
  id: string
  track: string
  phase: string
  title: string
  minutes: number
  updated: string
  /** El Markdown, sin el frontmatter. */
  content: string
  /** sha256 del archivo: cambia si cambia cualquier cosa. */
  hash: string
}

const KEYS = ['id', 'track', 'phase', 'title', 'minutes', 'updated'] as const

function isDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(`${value}T`)
}

/** Lee una lección. El error dice en qué archivo está el problema. */
export function parseLesson(text: string, file: string): LessonFile {
  const fail = (message: string): never => {
    throw new Error(`${file}: ${message}`)
  }
  let parsed: ReturnType<typeof parseFrontmatter>
  try {
    parsed = parseFrontmatter(text)
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'no se pudo leer el frontmatter.')
  }
  const { data, body } = parsed
  const missing = KEYS.filter((key) => !data[key])
  if (missing.length > 0) return fail(`en el frontmatter faltan ${missing.join(', ')}.`)

  const { id = '', track = '', phase = '', title = '', minutes = '', updated = '' } = data
  if (id !== basename(file, '.md')) {
    return fail(`el id «${id}» no coincide con el nombre del archivo.`)
  }
  if (!/^[1-9]\d*$/.test(minutes)) {
    return fail(`minutes debe ser un número entero mayor que 0 (dice «${minutes}»).`)
  }
  if (!isDate(updated)) return fail(`updated debe ser una fecha AAAA-MM-DD (dice «${updated}»).`)
  if (body.trim() === '') return fail('no tiene contenido.')

  const hash = createHash('sha256').update(normalizeText(text)).digest('hex')
  return { file, id, track, phase, title, minutes: Number(minutes), updated, content: body, hash }
}

/** Todas las lecciones de la carpeta. Si hay errores, los reúne todos. */
export async function loadLessons(dir: string): Promise<LessonFile[]> {
  const files = await readdir(dir, { recursive: true }).catch((error: unknown) => {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return []
    throw error
  })
  const lessons: LessonFile[] = []
  const errors: string[] = []
  // Los que empiezan por punto son del sistema (._x.md los crea el Mac al copiar).
  for (const file of files.filter((name) => name.endsWith('.md')).sort()) {
    if (basename(file).startsWith('.')) continue
    try {
      const text = await readFile(join(dir, file), 'utf8')
      lessons.push(parseLesson(text, file.split(sep).join('/')))
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }
  if (errors.length > 0) throw new Error(`No se cargó nada:\n- ${errors.join('\n- ')}`)
  return lessons
}
