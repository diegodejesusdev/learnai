// Carga todas las rutas de src/data/routes/ en tracks, phases, topics y checklist_items.
// Usa upsert por id: se puede correr las veces que quieras sin duplicar.
//
//   npm run seed         → Supabase local (lee .env.local)
//   npm run seed:cloud   → Supabase en la nube (lee .env.cloud)
//
// Necesita SUPABASE_SERVICE_ROLE_KEY (o la "secret key"), que salta RLS.
// Esa clave nunca va con prefijo VITE_ ni en Vercel.
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database.ts'
import { loadRoutes, ROUTES_DIR } from './routeFiles.ts'
import { seedRoutes, type ContentTable, type SeedRow, type SeedStore } from './seedRoutes.ts'

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error(
    'Faltan SUPABASE_URL (o VITE_SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY en el archivo .env.',
  )
  process.exit(1)
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Supabase devuelve como máximo 1000 filas por consulta: se piden por tandas. */
const PAGE = 1000

const store: SeedStore = {
  async read(table) {
    const rows: SeedRow[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('id')
        .range(from, from + PAGE - 1)
      if (error) throw new Error(`Error leyendo ${table}: ${error.message}`)
      rows.push(...(data as SeedRow[]))
      if (data.length < PAGE) return rows
    }
  },
  async upsert(table: ContentTable, rows) {
    const { error } = await supabase.from(table).upsert(rows as never, { onConflict: 'id' })
    if (error) throw new Error(`Error en ${table}: ${error.message}`)
  },
}

try {
  const routes = await loadRoutes(ROUTES_DIR)
  console.log(`Cargando ${routes.length} rutas en ${url}:`)
  for (const route of routes) {
    const topics = route.phases.reduce((sum, phase) => sum + phase.topics.length, 0)
    console.log(
      `  ${route.track.title} (versión ${route.version}): ${route.phases.length} fases, ` +
        `${topics} temas, ${route.final_checklist.length} ítems`,
    )
  }
  await seedRoutes(store, routes, console)
  console.log('Listo.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
