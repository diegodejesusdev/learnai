import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Curriculum } from '../src/types/curriculum.ts'

/** Cada .json de esta carpeta es una ruta. Agregar una ruta es agregar un archivo. */
export const ROUTES_DIR = join(import.meta.dirname, '../src/data/routes')

type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null
const hasStrings = (value: Json, keys: readonly string[]) =>
  keys.every((key) => typeof value[key] === 'string')

// Los ids van en la URL y en los filtros de Supabase: sin espacios, comas ni paréntesis.
// Mismo formato que acepta el tutor (supabase/functions/_shared/tutorRequest.ts).
const ID = /^[a-z0-9-]{1,40}$/

function isPhase(phase: Json): boolean {
  return (
    hasStrings(phase, ['title', 'summary']) &&
    typeof phase.order === 'number' &&
    typeof phase.estimated_weeks === 'number' &&
    isObject(phase.project) &&
    hasStrings(phase.project, ['title', 'description']) &&
    Array.isArray(phase.topics) &&
    phase.topics.every((topic) => isObject(topic) && hasStrings(topic, ['id', 'title', 'details']))
  )
}

/** Revisa la forma del archivo: un error aquí es más claro que uno de la base a mitad del seed. */
export function parseCurriculum(raw: unknown, file: string): Curriculum {
  const fail = (message: string): never => {
    throw new Error(`${file}: ${message}`)
  }
  if (!isObject(raw)) return fail('debe ser un objeto.')
  const { track, phases, final_checklist: checklist } = raw
  if (!isObject(track) || !hasStrings(track, ['id', 'title']) || typeof track.order !== 'number') {
    return fail('falta el bloque "track" con id, title y order.')
  }
  if (!hasStrings(raw, ['title', 'goal']) || typeof raw.version !== 'number') {
    return fail('faltan version, title o goal.')
  }
  if (!Array.isArray(phases)) return fail('falta la lista "phases".')
  for (const phase of phases as unknown[]) {
    if (!isObject(phase) || typeof phase.id !== 'string') return fail('hay una fase sin id.')
    if (!isPhase(phase)) return fail(`la fase ${phase.id} está incompleta.`)
  }
  if (!Array.isArray(checklist)) return fail('falta la lista "final_checklist".')
  for (const item of checklist as unknown[]) {
    if (!isObject(item) || !hasStrings(item, ['id', 'text'])) {
      return fail('hay un ítem de final_checklist sin id o sin text.')
    }
  }

  const curriculum = raw as unknown as Curriculum
  const ids = [
    curriculum.track.id,
    ...curriculum.phases.flatMap((phase) => [phase.id, ...phase.topics.map((topic) => topic.id)]),
    ...curriculum.final_checklist.map((item) => item.id),
  ]
  const badId = ids.find((id) => !ID.test(id))
  if (badId !== undefined) {
    return fail(`el id «${badId}» solo puede tener minúsculas, números y guiones.`)
  }
  return curriculum
}

/** Todas las rutas de la carpeta, por su orden. */
export async function loadRoutes(dir: string): Promise<Curriculum[]> {
  const files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort()
  const routes = await Promise.all(
    files.map(async (file) => {
      const text = await readFile(join(dir, file), 'utf8')
      let raw: unknown
      try {
        raw = JSON.parse(text)
      } catch (error) {
        throw new Error(
          `${file}: no es un JSON válido (${error instanceof Error ? error.message : 'error'}).`,
          { cause: error },
        )
      }
      return parseCurriculum(raw, file)
    }),
  )
  return routes.sort((a, b) => a.track.order - b.track.order)
}
