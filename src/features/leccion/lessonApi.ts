import { supabase } from '@/lib/supabase'

export interface LessonInfo {
  topicId: string
  /** Tiempo estimado, en minutos. */
  minutes: number
  /** AAAA-MM-DD */
  updated: string
  /** Cambia si cambia la lección: dice si la copia del dispositivo está al día. */
  hash: string
}

export interface Lesson extends LessonInfo {
  /** Markdown */
  content: string
}

/** Qué temas tienen lección, por id de tema. */
export type LessonIndex = Readonly<Partial<Record<string, LessonInfo>>>

export interface LessonProgress {
  /** Hasta dónde has llegado, de 0 a 100. */
  scrollPct: number
  /** Cuándo llegaste al final por primera vez. */
  readAt: string | null
}

export type LessonProgressMap = Readonly<Partial<Record<string, LessonProgress>>>

export interface LessonProgressInput extends LessonProgress {
  topicId: string
}

const LESSON_COLUMNS = 'topic_id, content_md, minutes, updated, content_hash'

interface LessonRow {
  topic_id: string
  content_md: string
  minutes: number
  updated: string
  content_hash: string
}

const toLesson = (row: LessonRow): Lesson => ({
  topicId: row.topic_id,
  content: row.content_md,
  minutes: row.minutes,
  updated: row.updated,
  hash: row.content_hash,
})

/** Las lecciones que hay, sin su contenido. */
export async function fetchLessonIndex(): Promise<LessonIndex> {
  const { data, error } = await supabase
    .from('lessons')
    .select('topic_id, minutes, updated, content_hash')
  if (error) throw error
  return Object.fromEntries(
    data.map((row) => [
      row.topic_id,
      {
        topicId: row.topic_id,
        minutes: row.minutes,
        updated: row.updated,
        hash: row.content_hash,
      },
    ]),
  )
}

/** null = el tema aún no tiene lección. */
export async function fetchLesson(topicId: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select(LESSON_COLUMNS)
    .eq('topic_id', topicId)
    .maybeSingle()
  if (error) throw error
  return data && toLesson(data)
}

export async function fetchLessons(topicIds: readonly string[]): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select(LESSON_COLUMNS)
    .in('topic_id', [...topicIds])
  if (error) throw error
  return data.map(toLesson)
}

export async function fetchLessonProgress(): Promise<LessonProgressMap> {
  // RLS devuelve solo las filas del usuario con sesión.
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('topic_id, scroll_pct, read_at')
  if (error) throw error
  return Object.fromEntries(
    data.map((row) => [row.topic_id, { scrollPct: row.scroll_pct, readAt: row.read_at }]),
  )
}

/** La base se queda con el porcentaje más alto y la primera lectura: repetirlo no cambia nada. */
export async function saveLessonProgress(input: LessonProgressInput): Promise<void> {
  const { error } = await supabase.rpc('save_lesson_progress', {
    p_topic_id: input.topicId,
    p_scroll_pct: input.scrollPct,
    ...(input.readAt === null ? {} : { p_read_at: input.readAt }),
  })
  if (error) throw error
}
