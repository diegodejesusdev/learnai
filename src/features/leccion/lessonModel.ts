import type {
  LessonIndex,
  LessonProgress,
  LessonProgressInput,
  LessonProgressMap,
} from './lessonApi'

// Funciones puras: qué se ha leído y qué está guardado en el dispositivo.

const unread: LessonProgress = { scrollPct: 0, readAt: null }

export function lessonProgressOf(
  map: LessonProgressMap | undefined,
  topicId: string,
): LessonProgress {
  return map?.[topicId] ?? unread
}

export function isLessonRead(map: LessonProgressMap | undefined, topicId: string): boolean {
  return lessonProgressOf(map, topicId).readAt !== null
}

function earliest(a: string | null, b: string | null): string | null {
  if (a === null || b === null) return a ?? b
  return Date.parse(a) <= Date.parse(b) ? a : b
}

/** Igual que save_lesson_progress en la base: el porcentaje más alto y la primera lectura. */
export function mergeProgress(a: LessonProgress, b: LessonProgress): LessonProgress {
  return {
    scrollPct: Math.max(a.scrollPct, b.scrollPct),
    readAt: earliest(a.readAt, b.readAt),
  }
}

export function withLessonProgress(
  map: LessonProgressMap,
  { topicId, ...progress }: LessonProgressInput,
): LessonProgressMap {
  return { ...map, [topicId]: mergeProgress(lessonProgressOf(map, topicId), progress) }
}

/** A tan pocos píxeles del final, ya se leyó. */
const END_TOLERANCE_PX = 8

/**
 * Cuánto de la lección (0 a 100) ya pasó por la pantalla, según dónde está su borde de arriba
 * respecto a la ventana. Sin altura (aún no se dibuja) es 0.
 */
export function readingPercent(
  lesson: { top: number; height: number },
  viewportHeight: number,
): number {
  if (lesson.height <= 0) return 0
  const seen = viewportHeight - lesson.top
  if (seen >= lesson.height - END_TOLERANCE_PX) return 100
  return Math.max(0, (seen / lesson.height) * 100)
}

const STEP = 10

/**
 * Lo que hay que guardar al llegar a ese porcentaje, o null si nada. Va de 10 en 10: sin conexión
 * cada guardado espera en la cola.
 */
export function nextProgress(
  current: LessonProgress,
  percent: number,
  now: string,
): LessonProgress | null {
  if (current.readAt !== null) return null
  if (percent >= 100) return { scrollPct: 100, readAt: now }
  const step = Math.floor(percent / STEP) * STEP
  return step > current.scrollPct ? { scrollPct: step, readAt: null } : null
}

export interface DownloadState {
  /** Temas cuya lección falta en el dispositivo o cambió desde que se guardó. */
  pending: string[]
  /** Lecciones guardadas y al día. */
  saved: number
  /** De las pendientes, las que tienen una copia vieja. */
  changed: number
}

/** Qué falta descargar de una fase. Los temas sin lección no cuentan. */
export function downloadState(
  topicIds: readonly string[],
  index: LessonIndex,
  hashes: Readonly<Partial<Record<string, string>>>,
): DownloadState {
  const lessons = topicIds.flatMap((id) => index[id] ?? [])
  const pending = lessons.filter(({ topicId, hash }) => hashes[topicId] !== hash)
  return {
    pending: pending.map(({ topicId }) => topicId),
    saved: lessons.length - pending.length,
    changed: pending.filter(({ topicId }) => hashes[topicId] !== undefined).length,
  }
}
