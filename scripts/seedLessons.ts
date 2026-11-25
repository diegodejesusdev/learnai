import { missingSections } from '../src/lib/lessonSections.ts'
import type { Curriculum } from '../src/types/curriculum.ts'
import type { TablesInsert } from '../src/types/database.ts'
import { orphanIds, toCurriculumRows } from './curriculumRows.ts'
import type { LessonFile } from './lessonFiles.ts'
import { seedRoutes, type SeedLog, type SeedStore } from './seedRoutes.ts'

// Las lecciones en el seed, sin conexión: se prueba en memoria (seedLessons.test.ts).

export type LessonRow = TablesInsert<'lessons'>

export interface ContentStore extends SeedStore {
  /** Los temas que ya tienen lección en la base. */
  readLessonIds(): Promise<string[]>
  /** Upsert por topic_id. */
  upsertLessons(rows: readonly LessonRow[]): Promise<void>
}

export interface SeedContent {
  routes: readonly Curriculum[]
  lessons: readonly LessonFile[]
}

interface KnownTopic {
  title: string
  phase: string
  track: string
}

/** Los temas que habrá tras el seed: los de la base y los de los archivos (que mandan). */
async function knownTopics(
  store: SeedStore,
  routes: readonly Curriculum[],
): Promise<Map<string, KnownTopic>> {
  const [dbPhases, dbTopics] = await Promise.all([store.read('phases'), store.read('topics')])
  const rows = routes.map(toCurriculumRows)
  const trackOf = new Map<string, string>()
  for (const { id, track_id: track } of [...dbPhases, ...rows.flatMap(({ phases }) => phases)]) {
    trackOf.set(id, track ?? '')
  }
  const topics = new Map<string, KnownTopic>()
  for (const topic of [...dbTopics, ...rows.flatMap((route) => route.topics)]) {
    const phase = topic.phase_id ?? ''
    topics.set(topic.id, { title: String(topic.title), phase, track: trackOf.get(phase) ?? '' })
  }
  return topics
}

/** Errores que detienen el seed. Lista vacía = todo bien. */
function lessonErrors(
  lessons: readonly LessonFile[],
  topics: ReadonlyMap<string, KnownTopic>,
): string[] {
  const errors: string[] = []
  const fileOf = new Map<string, string>()
  for (const { file, id, track, phase } of lessons) {
    const topic = topics.get(id)
    const other = fileOf.get(id)
    fileOf.set(id, file)
    if (!topic) {
      errors.push(
        `${file}: el id «${id}» no existe en topics. ` +
          'Revisa el id del frontmatter o agrega ese tema a su ruta en src/data/routes.',
      )
    } else if (topic.track !== track || topic.phase !== phase) {
      errors.push(
        `${file}: el tema ${id} es de la ruta «${topic.track}», fase «${topic.phase}», ` +
          `y el frontmatter dice «${track}», «${phase}».`,
      )
    }
    if (other) errors.push(`el tema ${id} tiene dos archivos: ${other} y ${file}.`)
  }
  return errors
}

/** Lo que conviene revisar, pero no impide cargar. */
function lessonWarnings(
  lessons: readonly LessonFile[],
  topics: ReadonlyMap<string, KnownTopic>,
): string[] {
  return lessons.flatMap(({ file, id, title, content }) => {
    const missing = missingSections(content)
    const topicTitle = topics.get(id)?.title
    return [
      ...(missing.length > 0 ? [`${file}: faltan las secciones ${missing.join(', ')}.`] : []),
      ...(topicTitle !== title
        ? [`${file}: el título dice «${title}» y el tema se llama «${topicTitle ?? ''}».`]
        : []),
    ]
  })
}

const toRow = ({ id, content, minutes, updated, hash }: LessonFile): LessonRow => ({
  topic_id: id,
  content_md: content,
  minutes,
  updated,
  content_hash: hash,
})

/**
 * Carga las rutas y las lecciones con upsert: se puede repetir sin duplicar. Primero revisa todo;
 * si hay un error (p. ej. una lección de un tema que no existe), no escribe nada.
 */
export async function seedContent(
  store: ContentStore,
  { routes, lessons }: SeedContent,
  log: SeedLog,
): Promise<void> {
  const topics = await knownTopics(store, routes)
  const errors = lessonErrors(lessons, topics)
  if (errors.length > 0) throw new Error(`No se cargó nada:\n- ${errors.join('\n- ')}`)

  await seedRoutes(store, routes, log)

  const current = await store.readLessonIds()
  if (lessons.length > 0) await store.upsertLessons(lessons.map(toRow))
  log.info(`✓ lessons: ${lessons.length}`)
  for (const warning of lessonWarnings(lessons, topics)) log.warn(`⚠ ${warning}`)
  const orphans = orphanIds(
    current,
    lessons.map((lesson) => lesson.id),
  )
  if (orphans.length > 0) {
    log.warn(
      `⚠ lessons: en la base hay lecciones sin archivo: ${orphans.join(', ')}.\n` +
        '  No se borran automáticamente: si fue un descuido, vuelve a copiar el archivo.',
    )
  }
}
