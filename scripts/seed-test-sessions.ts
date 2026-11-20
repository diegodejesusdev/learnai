// Sesiones de prueba para comprobar a mano el Historial y el Inicio (fase 5).
// SOLO para Supabase local: se niega a correr contra la nube.
//
//   npm run seed:sesiones -- --correo tu@correo.com   → borra las de prueba anteriores y crea 16
//   npm run seed:sesiones -- --correo tu@correo.com --borrar   → solo las borra
//
// Las sesiones llevan «[prueba]» al inicio de las notas: así se pueden borrar sin tocar las tuyas.
// Al final imprime lo que deberías ver (rachas, semanas y fases), calculado aquí con aritmética
// propia (Bogotá = UTC−5, sin horario de verano) y no con el código de la app, para que sirva de
// comprobación independiente.
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database.ts'

const MARK = '[prueba]'
const OFFSET_MS = 5 * 3_600_000 // Bogotá = UTC−5 todo el año

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.')
  process.exit(1)
}
const host = new URL(url).hostname
const isLocal =
  host === 'localhost' ||
  host === '127.0.0.1' ||
  /^10\./.test(host) ||
  /^192\.168\./.test(host) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(host)
if (!isLocal) {
  console.error(`${url} no es Supabase local. Este script solo crea datos de prueba en local.`)
  process.exit(1)
}

const args = process.argv.slice(2)
const emailIndex = args.indexOf('--correo')
const email = emailIndex >= 0 ? args[emailIndex + 1] : undefined
const onlyDelete = args.includes('--borrar')

const supabase = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Fechas de Bogotá con aritmética propia ───────────────────────────────────
const bogotaDay = (instant: Date) =>
  new Date(instant.getTime() - OFFSET_MS).toISOString().slice(0, 10)
const addDays = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
const mondayOf = (day: string) =>
  addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7))
const bogotaInstant = (day: string, time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return new Date(Date.parse(`${day}T00:00:00Z`) + (hours * 60 + minutes) * 60_000 + OFFSET_MS)
}

type Mode = Database['public']['Enums']['study_mode']
interface Plan {
  daysAgo: number
  time: string
  minutes: number
  /** Duración total con descansos (≥ minutes). */
  span: number
  mode: Mode
  topic?: string
  project?: string
  notes?: string
}

// Racha actual: hoy, ayer y anteayer (3). Hace 3 días solo hay 10 min: no cuenta y la corta.
// Racha máxima: de hace 8 a hace 4 días (5). Hace 9 días no hay nada.
const plans: Plan[] = [
  { daysAgo: 0, time: 'now-30', minutes: 25, span: 25, mode: 'free', topic: 'f2-t1' },
  { daysAgo: 1, time: '20:00', minutes: 40, span: 45, mode: 'pomodoro', topic: 'f1-t5' },
  {
    daysAgo: 2,
    time: '23:40',
    minutes: 45,
    span: 45,
    mode: 'free',
    topic: 'f1-t5',
    notes: 'Cruza la medianoche: cuenta entera en el día en que empezó.',
  },
  { daysAgo: 3, time: '07:30', minutes: 10, span: 10, mode: 'manual', topic: 'f1-t4' },
  { daysAgo: 4, time: '18:00', minutes: 30, span: 30, mode: 'pomodoro', topic: 'f1-t3' },
  { daysAgo: 5, time: '19:00', minutes: 20, span: 20, mode: 'free', topic: 'f1-t2' },
  { daysAgo: 6, time: '08:00', minutes: 60, span: 65, mode: 'pomodoro', topic: 'f1-t1' },
  {
    daysAgo: 7,
    time: '21:00',
    minutes: 15,
    span: 15,
    mode: 'manual',
    topic: 'f0-t8',
    notes: 'Justo el mínimo (15 min): sí cuenta.',
  },
  { daysAgo: 8, time: '10:00', minutes: 50, span: 50, mode: 'manual', project: 'f0' },
  {
    daysAgo: 10,
    time: '12:00',
    minutes: 90,
    span: 105,
    mode: 'pomodoro',
    topic: 'f0-t6',
    notes: 'Notas con coma, "comillas"\ny un salto de línea: automatización, diseño, año.',
  },
  { daysAgo: 20, time: '15:00', minutes: 120, span: 140, mode: 'pomodoro', topic: 'f0-t5' },
  { daysAgo: 35, time: '09:15', minutes: 35, span: 35, mode: 'free', topic: 'f0-t3' },
  { daysAgo: 60, time: '17:30', minutes: 75, span: 75, mode: 'manual', topic: 'f0-t2' },
  { daysAgo: 100, time: '11:00', minutes: 45, span: 45, mode: 'free', topic: 'f0-t1' },
  { daysAgo: 150, time: '16:00', minutes: 30, span: 30, mode: 'manual', project: 'f0' },
  // Fuera del mapa de calor (más de 6 meses), pero sí en los totales por fase.
  { daysAgo: 200, time: '10:00', minutes: 20, span: 20, mode: 'manual', topic: 'f0-t1' },
]

async function findUserId(): Promise<string> {
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) throw error
  const users = email ? data.users.filter((user) => user.email === email) : data.users
  if (users.length === 1 && users[0]) return users[0].id
  console.error(
    data.users.length === 0
      ? 'No hay usuarios en Supabase local. Entra una vez a la app (npm run dev) y vuelve a correrlo.'
      : `Indica el usuario con --correo. Usuarios locales: ${data.users.map((user) => user.email).join(', ')}`,
  )
  process.exit(1)
}

const userId = await findUserId()
const { error: deleteError, count } = await supabase
  .from('study_sessions')
  .delete({ count: 'exact' })
  .eq('user_id', userId)
  .like('notes', `${MARK}%`)
if (deleteError) throw deleteError
console.log(`Borradas ${count ?? 0} sesiones de prueba anteriores.`)
if (onlyDelete) process.exit(0)

const now = new Date()
const today = bogotaDay(now)
const rows = plans.map((plan) => {
  const start =
    plan.time === 'now-30'
      ? new Date(now.getTime() - 30 * 60_000)
      : bogotaInstant(addDays(today, -plan.daysAgo), plan.time)
  if (bogotaDay(start) !== addDays(today, -plan.daysAgo)) {
    console.error('Son menos de las 12:30 a. m. en Colombia: corre el script un poco más tarde.')
    process.exit(1)
  }
  return {
    user_id: userId,
    topic_id: plan.topic ?? null,
    project_phase_id: plan.project ?? null,
    started_at: start.toISOString(),
    ended_at: new Date(start.getTime() + plan.span * 60_000).toISOString(),
    duration_minutes: plan.minutes,
    mode: plan.mode,
    notes: `${MARK} ${plan.notes ?? ''}`.trim(),
  }
})
const { error: insertError } = await supabase.from('study_sessions').insert(rows)
if (insertError) throw insertError
console.log(
  `Creadas ${rows.length} sesiones de prueba para ${email ?? 'el único usuario local'}.\n`,
)

// ── Lo que deberías ver ──────────────────────────────────────────────────────
const byDay = new Map<string, number>()
for (const row of rows) {
  const day = bogotaDay(new Date(row.started_at))
  byDay.set(day, (byDay.get(day) ?? 0) + row.duration_minutes)
}
const counts = (day: string) => (byDay.get(day) ?? 0) >= 15
let current = 0
for (let day = counts(today) ? today : addDays(today, -1); counts(day); day = addDays(day, -1)) {
  current += 1
}
let max = 0
let run = 0
for (let index = 400; index >= 0; index -= 1) {
  run = counts(addDays(today, -index)) ? run + 1 : 0
  max = Math.max(max, run)
}
const thisMonday = mondayOf(today)
const weeks = Array.from({ length: 12 }, (_, index) => addDays(thisMonday, -7 * (11 - index)))
const weekMinutes = (monday: string) =>
  [...byDay]
    .filter(([day]) => mondayOf(day) === monday)
    .reduce((sum, [, minutes]) => sum + minutes, 0)
const phaseOf = (row: (typeof rows)[number]) =>
  row.project_phase_id ?? row.topic_id?.split('-')[0] ?? '?'
const byPhase = new Map<string, number>()
for (const row of rows)
  byPhase.set(phaseOf(row), (byPhase.get(phaseOf(row)) ?? 0) + row.duration_minutes)

console.log('Con el mínimo de racha en 15 min (el valor por defecto) deberías ver:')
console.log(`  Hoy (${today}): ${byDay.get(today) ?? 0} min`)
console.log(`  Racha actual: ${current} días · Racha máxima: ${max} días`)
console.log(`  Esta semana (desde el lunes ${thisMonday}): ${weekMinutes(thisMonday)} min`)
console.log('  Minutos por semana (lunes → minutos):')
for (const monday of weeks) console.log(`    ${monday}  ${weekMinutes(monday)}`)
console.log('  Minutos por fase:')
for (const [phase, minutes] of [...byPhase].sort()) console.log(`    ${phase}  ${minutes}`)
console.log(
  `  Total: ${rows.length} sesiones, ${rows.reduce((sum, row) => sum + row.duration_minutes, 0)} min`,
)
console.log('  Días con estudio (día → minutos; toca cada uno en el mapa de calor):')
for (const [day, minutes] of [...byDay].sort()) {
  const outside = day < addDays(today, -183) ? '  (más de 6 meses: no sale en el mapa)' : ''
  console.log(`    ${day}  ${minutes}${outside}`)
}
