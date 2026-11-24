// Prueba la migración de las rutas (…_tracks.sql) sobre una copia con datos y comprueba que el
// progreso queda intacto, fila por fila. Necesita Supabase local encendido (npm run db:start).
//
//   npm run db:test:migracion                           → con datos de ejemplo
//   npm run db:test:migracion -- --respaldo ~/datos.sql   → con un respaldo (solo datos) de la nube
//
// Todo pasa en una base temporal dentro del Postgres local, que se borra al final: ni tu base
// local ni la nube se tocan. El respaldo se crea con:
//   npx supabase db dump --remote --data-only --schema public -f ~/datos.sql   (fuera del repo: es privado)
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { toCurriculumRows } from './curriculumRows.ts'
import { loadRoutes, ROUTES_DIR } from './routeFiles.ts'
import { seedRoutes, type SeedRow, type SeedStore } from './seedRoutes.ts'

const CONTAINER = 'supabase_db_LearnAI'
const DATABASE = 'learnai_prueba_migracion'
const MIGRATIONS = join(import.meta.dirname, '../supabase/migrations')
const TRACKS_MIGRATION = /_tracks\.sql$/

/** Corre SQL en el Postgres local. Con un error, psql sale con código ≠ 0 y esto lanza. */
function psql(sql: string, database = DATABASE): string {
  return execFileSync(
    'docker',
    ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', database]
      // -q y -At: solo los valores, sin encabezados.
      .concat(['-v', 'ON_ERROR_STOP=1', '-qAt', '--single-transaction', '-f', '-']),
    { input: sql, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  ).trim()
}

const literal = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'`

/** Inserta filas JSON; con `update`, hace el mismo upsert por id que el seed. */
function insertSql(table: string, rows: readonly object[], update = false): string {
  const columns = Object.keys(rows[0] ?? {})
  const list = columns.join(', ')
  const onConflict = update
    ? ` on conflict (id) do update set ${columns.map((column) => `${column} = excluded.${column}`).join(', ')}`
    : ''
  return `insert into public.${table} (${list}) select ${list} from jsonb_populate_recordset(null::public.${table}, ${literal(rows)}::jsonb)${onConflict};`
}

// ── Lo que no debe cambiar ───────────────────────────────────────────────────
const USER_TABLES = {
  topic_progress: 'user_id, topic_id',
  project_progress: 'user_id, phase_id',
  checklist_progress: 'user_id, item_id',
  study_sessions: 'id',
  active_timer: 'user_id',
  tutor_conversations: 'id',
  tutor_messages: 'id',
  quiz_results: 'id',
  user_settings: 'user_id',
} as const
const CONTENT_TABLES = {
  curriculum_meta: 'id',
  phases: 'id',
  topics: 'id',
  checklist_items: 'id',
} as const

type Snapshot = Record<string, object[]>

/** Todas las filas de las tablas, sin las columnas que agrega esta migración. */
function snapshot(tables: Record<string, string>): Snapshot {
  return Object.fromEntries(
    Object.entries(tables).map(([table, key]) => {
      const json = psql(
        `select coalesce(jsonb_agg(to_jsonb(t) - 'track_id' - 'active_track_id' order by ${key}), '[]') from public.${table} t;`,
      )
      return [table, JSON.parse(json) as object[]]
    }),
  )
}

let failures = 0
function check(ok: boolean, text: string): void {
  if (!ok) failures += 1
  console.log(`${ok ? '✓' : '✗'} ${text}`)
}
function checkSame(before: Snapshot, after: Snapshot, when: string): void {
  for (const [table, rows] of Object.entries(before)) {
    const same = JSON.stringify(rows) === JSON.stringify(after[table])
    check(same, `${table}: ${rows.length} filas iguales ${when}`)
  }
}

// ── Datos de ejemplo: dos usuarios con algo en todas las tablas ──────────────
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const uuid = (n: number) => `cccccccc-cccc-4ccc-8ccc-${String(n).padStart(12, '0')}`
const DAY = '2026-11-20T'

function sampleSql(): string {
  return [
    `insert into auth.users (id, email) values ('${A}', 'a@prueba.local'), ('${B}', 'b@prueba.local');`,
    insertSql('topic_progress', [
      {
        user_id: A,
        topic_id: 'f0-t1',
        status: 'hecho',
        notes: "Notas con «comillas», 'simples' y\nsaltos de línea ✅",
        completed_at: `${DAY}10:00:00Z`,
        updated_at: `${DAY}10:00:00Z`,
      },
      {
        user_id: A,
        topic_id: 'f1-t5',
        status: 'en_curso',
        notes: 'webhook.site',
        completed_at: null,
        updated_at: `${DAY}11:00:00Z`,
      },
      {
        user_id: A,
        topic_id: 'f8-t6',
        status: 'pendiente',
        notes: 'Solo una nota',
        completed_at: null,
        updated_at: `${DAY}12:00:00Z`,
      },
      {
        user_id: B,
        topic_id: 'f0-t1',
        status: 'en_curso',
        notes: '',
        completed_at: null,
        updated_at: `${DAY}12:00:00Z`,
      },
    ]),
    insertSql('project_progress', [
      {
        user_id: A,
        phase_id: 'f0',
        status: 'hecho',
        repo_url: 'https://github.com/prueba/mapa',
        demo_url: null,
        notes: 'Entregado',
        completed_at: `${DAY}13:00:00Z`,
        updated_at: `${DAY}13:00:00Z`,
      },
    ]),
    insertSql('checklist_progress', [
      { user_id: A, item_id: 'c1', done: true, done_at: `${DAY}14:00:00Z` },
      { user_id: A, item_id: 'c14', done: false, done_at: null },
    ]),
    insertSql(
      'study_sessions',
      [
        { topic_id: 'f1-t5', project_phase_id: null, mode: 'pomodoro', notes: 'Firmas HMAC' },
        { topic_id: null, project_phase_id: 'f0', mode: 'manual', notes: '' },
        { topic_id: 'f8-t6', project_phase_id: null, mode: 'free', notes: 'Con, comas' },
      ].map((session, index) => ({
        ...session,
        id: uuid(index),
        user_id: A,
        started_at: `${DAY}1${index}:00:00Z`,
        ended_at: `${DAY}1${index}:50:00Z`,
        duration_minutes: 25 + index,
        created_at: `${DAY}20:00:00Z`,
        updated_at: `${DAY}20:00:00Z`,
      })),
    ),
    insertSql('active_timer', [
      {
        user_id: A,
        topic_id: 'f2-t9',
        project_phase_id: null,
        mode: 'pomodoro',
        started_at: `${DAY}21:00:00Z`,
        paused_at: `${DAY}21:10:00Z`,
        paused_seconds: 30,
        work_min: 25,
        break_min: 5,
        session_id: uuid(90),
        updated_at: `${DAY}21:10:00Z`,
      },
    ]),
    insertSql(
      'tutor_conversations',
      [
        { id: uuid(10), mode: 'explain', topic_id: 'f1-t5', phase_id: null, title: 'Webhooks' },
        { id: uuid(11), mode: 'project_review', topic_id: null, phase_id: 'f0', title: 'Mapa' },
        { id: uuid(12), mode: 'daily_plan', topic_id: null, phase_id: null, title: 'Hoy' },
      ].map((row) => ({
        ...row,
        user_id: A,
        created_at: `${DAY}15:00:00Z`,
        updated_at: `${DAY}15:00:00Z`,
      })),
    ),
    insertSql(
      'tutor_messages',
      [
        { id: uuid(20), role: 'user', content: '¿Qué es un webhook?' },
        { id: uuid(21), role: 'assistant', content: 'Un aviso.\n\n```json\n{ "a": 1 }\n```' },
      ].map((row) => ({
        ...row,
        conversation_id: uuid(10),
        user_id: A,
        model: null,
        tokens_in: null,
        tokens_out: 12,
        created_at: `${DAY}15:01:00Z`,
      })),
    ),
    insertSql('quiz_results', [
      {
        id: uuid(30),
        user_id: A,
        message_id: uuid(21),
        topic_id: 'f1-t5',
        score: 1,
        total: 2,
        answers: [0, 3],
        created_at: `${DAY}16:00:00Z`,
        updated_at: `${DAY}16:00:00Z`,
      },
    ]),
    `update public.user_settings set weekly_goal_minutes = 480, streak_min_minutes = 20, theme = 'dark' where user_id = '${A}';`,
  ].join('\n')
}

/** Lo mínimo de Supabase Auth que usan las migraciones (los roles ya existen en el servidor). */
const AUTH_STUB = `
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;`

const store: SeedStore = {
  read: (table) =>
    Promise.resolve(
      JSON.parse(
        psql(`select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.${table} t;`),
      ) as SeedRow[],
    ),
  upsert: (table, rows) => {
    psql(insertSql(table, rows, true))
    return Promise.resolve()
  },
}

async function run(backup: string | undefined): Promise<void> {
  const files = readdirSync(MIGRATIONS).sort()
  const index = files.findIndex((file) => TRACKS_MIGRATION.test(file))
  const migration = files[index]
  if (migration === undefined) throw new Error('No se encontró la migración …_tracks.sql')
  const sqlOf = (file: string) => readFileSync(join(MIGRATIONS, file), 'utf8')
  const routes = await loadRoutes(ROUTES_DIR)
  const automation = routes.find((route) => route.track.id === 'automatizacion')
  if (!automation) throw new Error('Falta la ruta automatizacion')

  console.log(`Base temporal con las migraciones anteriores a ${migration}`)
  psql(AUTH_STUB)
  for (const file of files.slice(0, index)) psql(sqlOf(file))
  if (backup) {
    console.log(`Cargando el respaldo ${backup}`)
    // replica: sin triggers ni claves foráneas al cargar (el respaldo no trae auth.users).
    psql(`set session_replication_role = replica;\n${readFileSync(backup, 'utf8')}`)
  } else {
    const { phases, topics, checklist } = toCurriculumRows(automation)
    const withoutTrack = (rows: readonly object[]) =>
      rows.map((row) =>
        Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'track_id')),
      )
    psql(
      [
        `insert into public.curriculum_meta (id, version, title, goal) values (1, 1, 'Ruta', 'Meta');`,
        insertSql('phases', withoutTrack(phases)),
        insertSql('topics', topics),
        insertSql('checklist_items', withoutTrack(checklist)),
        sampleSql(),
      ].join('\n'),
    )
  }

  const userBefore = snapshot(USER_TABLES)
  const contentBefore = snapshot(CONTENT_TABLES)
  if (!backup) {
    const empty = Object.entries(userBefore).filter(([, rows]) => rows.length === 0)
    check(empty.length === 0, 'Los datos de ejemplo cubren todas las tablas del usuario')
  }

  console.log('\nTras la migración:')
  psql(sqlOf(migration))
  checkSame(userBefore, snapshot(USER_TABLES), 'que antes')
  checkSame(contentBefore, snapshot(CONTENT_TABLES), 'que antes')
  const perTrack = (table: string) =>
    psql(`select string_agg(distinct track_id, ',') || ' ' || count(*) from public.${table};`)
  check(perTrack('phases') === 'automatizacion 9', `Fases: ${perTrack('phases')}`)
  check(
    perTrack('checklist_items') === 'automatizacion 14',
    `Checklist: ${perTrack('checklist_items')}`,
  )
  check(
    psql('select count(*) from public.user_settings where active_track_id is not null;') === '0',
    'Nadie tiene ruta activa todavía (la app usa la primera)',
  )

  const quiet = { info: () => {}, warn: (text: string) => console.log(text) }
  console.log('\nTras el seed de las dos rutas:')
  await seedRoutes(store, routes, quiet)
  checkSame(userBefore, snapshot(USER_TABLES), 'que antes')
  const counts = () =>
    psql(
      `select string_agg(t.id || ' ' || (select count(*) from public.phases p where p.track_id = t.id) || '/' ||
         (select count(*) from public.topics x join public.phases p on p.id = x.phase_id where p.track_id = t.id) || '/' ||
         (select count(*) from public.checklist_items c where c.track_id = t.id), ', ' order by t.sort_order)
       from public.tracks t;`,
    )
  check(counts() === 'automatizacion 9/100/14, ingenieria-datos 13/110/15', `Rutas: ${counts()}`)

  console.log('\nTras repetir el seed:')
  const seeded = snapshot({ ...CONTENT_TABLES, tracks: 'id' })
  await seedRoutes(store, routes, quiet)
  checkSame(seeded, snapshot({ ...CONTENT_TABLES, tracks: 'id' }), 'que tras el primero')
  checkSame(userBefore, snapshot(USER_TABLES), 'que antes')
}

const args = process.argv.slice(2)
const backupIndex = args.indexOf('--respaldo')
const backupFile = backupIndex >= 0 ? args[backupIndex + 1] : undefined
if (backupIndex >= 0 && !backupFile) {
  console.error('Indica el archivo: --respaldo datos.sql')
  process.exit(1)
}

// create/drop database no pueden ir en una transacción: van con -c, uno por llamada.
const admin = (sql: string) =>
  execFileSync(
    'docker',
    ['exec', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-qc', sql],
    {
      stdio: ['ignore', 'ignore', 'inherit'],
    },
  )

try {
  admin(`drop database if exists ${DATABASE}`)
  admin(`create database ${DATABASE}`)
  await run(backupFile)
} catch (error) {
  failures += 1
  console.error(error instanceof Error ? error.message : error)
} finally {
  admin(`drop database if exists ${DATABASE}`)
}
console.log(failures === 0 ? '\nTodo intacto.' : `\n${failures} comprobaciones fallaron.`)
process.exit(failures === 0 ? 0 : 1)
