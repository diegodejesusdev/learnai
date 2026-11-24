import type { Curriculum } from '../src/types/curriculum.ts'
import { orphanIds, toCurriculumRows, validateRoutes } from './curriculumRows.ts'

// La lógica del seed, sin conexión: la usan seed-curriculum.ts (Supabase), la prueba de la
// migración (Postgres local) y los tests (en memoria).

/** Las únicas tablas que escribe el seed: nunca las del usuario. */
export type ContentTable = 'tracks' | 'phases' | 'topics' | 'checklist_items'

export interface SeedRow {
  id: string
  track_id?: string
  phase_id?: string
  [column: string]: unknown
}

export interface SeedStore {
  /** Todas las filas de la tabla (bastan id, track_id y phase_id). */
  read(table: ContentTable): Promise<SeedRow[]>
  /** Upsert por id: crea las filas nuevas y actualiza las que ya existen. */
  upsert(table: ContentTable, rows: readonly SeedRow[]): Promise<void>
}

export interface SeedLog {
  info(text: string): void
  warn(text: string): void
}

type TableRows = Record<ContentTable, SeedRow[]>

function toTableRows(routes: readonly Curriculum[]): TableRows {
  const rows = routes.map(toCurriculumRows)
  return {
    tracks: rows.map(({ track }) => ({ ...track })),
    phases: rows.flatMap(({ phases }) => phases),
    topics: rows.flatMap(({ topics }) => topics),
    checklist_items: rows.flatMap(({ checklist }) => checklist),
  }
}

/** Filas que en la base pertenecen a otra ruta: el upsert las cambiaría de ruta sin avisar. */
function ownershipErrors(next: TableRows, current: TableRows): string[] {
  const errors: string[] = []
  const check = (id: string, owner: string | undefined, wanted: string | undefined) => {
    if (owner !== undefined && owner !== wanted) {
      errors.push(`${id} es de la ruta «${owner}» en la base y aquí está en «${wanted ?? '?'}»`)
    }
  }
  for (const table of ['phases', 'checklist_items'] as const) {
    const owners = new Map(current[table].map((row) => [row.id, row.track_id]))
    for (const row of next[table]) check(row.id, owners.get(row.id), row.track_id)
  }
  const currentPhases = new Map(current.phases.map((row) => [row.id, row.track_id]))
  const nextPhases = new Map(next.phases.map((row) => [row.id, row.track_id]))
  const topicPhases = new Map(current.topics.map((row) => [row.id, row.phase_id]))
  for (const row of next.topics) {
    const phaseId = topicPhases.get(row.id)
    if (phaseId !== undefined) {
      check(row.id, currentPhases.get(phaseId), nextPhases.get(row.phase_id ?? ''))
    }
  }
  return errors
}

/**
 * Carga las rutas con upsert por id: se puede repetir sin duplicar. Primero revisa todo; si hay
 * un error, no escribe nada. No borra lo que ya no esté en los archivos: lo avisa.
 */
export async function seedRoutes(
  store: SeedStore,
  routes: readonly Curriculum[],
  log: SeedLog,
): Promise<void> {
  const errors = validateRoutes(routes)
  if (errors.length > 0) throw new Error(`No se cargó nada:\n- ${errors.join('\n- ')}`)

  const next = toTableRows(routes)
  const [tracks, phases, topics, checklist_items] = await Promise.all([
    store.read('tracks'),
    store.read('phases'),
    store.read('topics'),
    store.read('checklist_items'),
  ])
  const current: TableRows = { tracks, phases, topics, checklist_items }
  const moved = ownershipErrors(next, current)
  if (moved.length > 0) throw new Error(`No se cargó nada:\n- ${moved.join('\n- ')}`)

  // El orden importa: las fases apuntan a las rutas y los temas a las fases.
  for (const table of ['tracks', 'phases', 'topics', 'checklist_items'] as const) {
    await store.upsert(table, next[table])
    log.info(`✓ ${table}: ${next[table].length}`)
  }

  for (const table of ['tracks', 'phases', 'topics', 'checklist_items'] as const) {
    const orphans = orphanIds(
      current[table].map((row) => row.id),
      next[table].map((row) => row.id),
    )
    if (orphans.length > 0) {
      log.warn(
        `⚠ ${table}: en la base hay ids que ya no están en los archivos: ${orphans.join(', ')}.\n` +
          '  No se borran automáticamente para no perder tu progreso ligado a ellos.',
      )
    }
  }
}
