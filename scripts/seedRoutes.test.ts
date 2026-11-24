import { describe, expect, it } from 'vitest'
import type { Curriculum } from '../src/types/curriculum.ts'
import { loadRoutes, ROUTES_DIR } from './routeFiles.ts'
import { seedRoutes, type ContentTable, type SeedRow, type SeedStore } from './seedRoutes.ts'

const routes = await loadRoutes(ROUTES_DIR)
const [auto, data] = routes
const [firstDataPhase, ...otherDataPhases] = data?.phases ?? []
if (!auto || !data || !firstDataPhase) throw new Error('Faltan rutas')
const automation = [auto]

/** Base en memoria con el mismo upsert por id que Postgres. Anota cada escritura. */
function memoryStore(failOn?: ContentTable) {
  const tables = new Map<string, Map<string, SeedRow>>()
  const writes: string[] = []
  const store: SeedStore = {
    read: (table) => Promise.resolve([...(tables.get(table)?.values() ?? [])]),
    upsert: (table, rows) => {
      if (table === failOn) return Promise.reject(new Error(`Error en ${table}: sin red`))
      writes.push(table)
      const current = tables.get(table) ?? new Map<string, SeedRow>()
      for (const row of rows) current.set(row.id, { ...current.get(row.id), ...row })
      tables.set(table, current)
      return Promise.resolve()
    },
  }
  const snapshot = () =>
    JSON.stringify([...tables].map(([name, rows]) => [name, [...rows.values()]]))
  const count = (table: ContentTable) => tables.get(table)?.size ?? 0
  return { store, writes, snapshot, count, tables }
}

const quiet = { info: () => {}, warn: () => {} }

describe('seedRoutes', () => {
  it('carga las dos rutas', async () => {
    const { store, count } = memoryStore()
    await seedRoutes(store, routes, quiet)
    expect(count('tracks')).toBe(2)
    expect(count('phases')).toBe(22)
    expect(count('topics')).toBe(210)
    expect(count('checklist_items')).toBe(29)
  })

  it('es idempotente: correrlo otra vez deja lo mismo', async () => {
    const { store, snapshot } = memoryStore()
    await seedRoutes(store, routes, quiet)
    const first = snapshot()
    await seedRoutes(store, routes, quiet)
    expect(snapshot()).toBe(first)
  })

  it('agregar la segunda ruta no cambia nada de la primera', async () => {
    const { store, tables } = memoryStore()
    await seedRoutes(store, automation, quiet)
    const before = structuredClone([...(tables.get('topics')?.values() ?? [])])
    await seedRoutes(store, routes, quiet)
    expect([...(tables.get('topics')?.values() ?? [])].slice(0, 100)).toEqual(before)
  })

  it('escribe primero las rutas y las fases, y solo tablas de contenido', async () => {
    const { store, writes } = memoryStore()
    await seedRoutes(store, routes, quiet)
    expect(writes).toEqual(['tracks', 'phases', 'topics', 'checklist_items'])
  })

  it('con una ruta inválida no escribe nada', async () => {
    const { store, writes } = memoryStore()
    const broken: Curriculum[] = [...routes, { ...auto, title: 'Copia' }]
    await expect(seedRoutes(store, broken, quiet)).rejects.toThrow('Id de ruta repetido')
    expect(writes).toEqual([])
  })

  it('un id que en la base es de otra ruta no se mueve: aborta sin escribir', async () => {
    const { store, writes } = memoryStore()
    await seedRoutes(store, routes, quiet)
    writes.length = 0
    // Un archivo nuevo reutiliza ids de automatización, cuyo archivo ya no está en la carpeta.
    const stolen: Curriculum = { ...auto, track: { id: 'robada', title: 'Robada', order: 7 } }
    await expect(seedRoutes(store, [stolen], quiet)).rejects.toThrow(
      /f0 es de la ruta «automatizacion»/,
    )
    expect(writes).toEqual([])
  })

  it('un tema no puede pasar a una fase de otra ruta', async () => {
    const { store, writes } = memoryStore()
    await seedRoutes(store, automation, quiet)
    writes.length = 0
    const moved: Curriculum = {
      ...data,
      phases: [
        { ...firstDataPhase, topics: [{ id: 'f0-t1', title: 'x', details: '' }] },
        ...otherDataPhases,
      ],
    }
    await expect(seedRoutes(store, [moved], quiet)).rejects.toThrow(
      /f0-t1 es de la ruta «automatizacion»/,
    )
    expect(writes).toEqual([])
  })

  it('avisa de los ids que sobran en la base, pero no los borra', async () => {
    const { store, count } = memoryStore()
    await seedRoutes(store, routes, quiet)
    const warnings: string[] = []
    await seedRoutes(store, automation, { ...quiet, warn: (text) => warnings.push(text) })
    expect(warnings.join('\n')).toContain('tracks: en la base hay ids que ya no están')
    expect(warnings.join('\n')).toContain('ingenieria-datos')
    expect(count('topics')).toBe(210)
  })

  it('si una tabla falla, se detiene con el error', async () => {
    const { store, writes } = memoryStore('topics')
    await expect(seedRoutes(store, routes, quiet)).rejects.toThrow('Error en topics: sin red')
    expect(writes).toEqual(['tracks', 'phases'])
  })
})
