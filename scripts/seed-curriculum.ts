// Carga curriculum.json en phases, topics, checklist_items y curriculum_meta.
// Usa upsert por id: se puede correr las veces que quieras sin duplicar.
//
//   npm run seed         → Supabase local (lee .env.local)
//   npm run seed:cloud   → Supabase en la nube (lee .env.cloud)
//
// Necesita SUPABASE_SERVICE_ROLE_KEY (o la "secret key"), que salta RLS.
// Esa clave nunca va con prefijo VITE_ ni en Vercel.
import { createClient } from '@supabase/supabase-js'
import curriculumJson from '../curriculum.json' with { type: 'json' }
import type { Curriculum } from '../src/types/curriculum.ts'
import type { Database } from '../src/types/database.ts'
import { orphanIds, toCurriculumRows, validateCurriculum } from './curriculumRows.ts'

const curriculum: Curriculum = curriculumJson

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error(
    'Faltan SUPABASE_URL (o VITE_SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY en el archivo .env.',
  )
  process.exit(1)
}

const errors = validateCurriculum(curriculum)
if (errors.length > 0) {
  console.error('curriculum.json tiene errores; no se cargó nada:\n- ' + errors.join('\n- '))
  process.exit(1)
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const rows = toCurriculumRows(curriculum)

function check(table: string, result: { error: { message: string } | null }, count: number): void {
  if (result.error) throw new Error(`Error en ${table}: ${result.error.message}`)
  console.log(`✓ ${table}: ${count}`)
}

async function warnOrphans(table: 'phases' | 'topics' | 'checklist_items', jsonIds: string[]) {
  const { data, error } = await supabase.from(table).select('id')
  if (error) throw new Error(`Error leyendo ${table}: ${error.message}`)
  const orphans = orphanIds(
    data.map((row) => row.id),
    jsonIds,
  )
  if (orphans.length > 0) {
    console.warn(
      `⚠ ${table}: en la base hay ids que ya no están en curriculum.json: ${orphans.join(', ')}.\n` +
        '  No se borran automáticamente para no perder tu progreso ligado a ellos.',
    )
  }
}

console.log(`Cargando «${curriculum.title}» (versión ${curriculum.version}) en ${url}`)
try {
  // El orden importa: los temas apuntan a las fases.
  const upsertById = { onConflict: 'id' }
  check('curriculum_meta', await supabase.from('curriculum_meta').upsert(rows.meta, upsertById), 1)
  check('phases', await supabase.from('phases').upsert(rows.phases, upsertById), rows.phases.length)
  check('topics', await supabase.from('topics').upsert(rows.topics, upsertById), rows.topics.length)
  check(
    'checklist_items',
    await supabase.from('checklist_items').upsert(rows.checklist, upsertById),
    rows.checklist.length,
  )
  await warnOrphans(
    'phases',
    rows.phases.map((row) => row.id),
  )
  await warnOrphans(
    'topics',
    rows.topics.map((row) => row.id),
  )
  await warnOrphans(
    'checklist_items',
    rows.checklist.map((row) => row.id),
  )
  console.log('Listo.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
