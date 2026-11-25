import type { ExportRows } from './exportApi'

/** Versión del formato del archivo, por si algún día cambia. */
export const EXPORT_FORMAT = 3

/** Quita user_id: en un archivo de una sola persona no aporta nada. */
function withoutUser<T extends { user_id: string }>(row: T): Omit<T, 'user_id'> {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'user_id')) as Omit<
    T,
    'user_id'
  >
}

/** De qué ruta es cada tema, fase o ítem. null si ya no está en ninguna. */
function trackLookup(rows: ExportRows) {
  const byPhase = new Map(rows.phases.map((phase) => [phase.id, phase.track_id]))
  const byTopic = new Map(rows.topics.map((topic) => [topic.id, byPhase.get(topic.phase_id)]))
  const byItem = new Map(rows.checklistItems.map((item) => [item.id, item.track_id]))
  return {
    /** Un tema o el proyecto de una fase; ninguno de los dos («¿Qué estudio hoy?») → null. */
    ofTarget: (topicId: string | null, phaseId: string | null): string | null =>
      (topicId !== null ? byTopic.get(topicId) : byPhase.get(phaseId ?? '')) ?? null,
    ofItem: (itemId: string): string | null => byItem.get(itemId) ?? null,
  }
}

const minutesOf = (sessions: readonly { duration_minutes: number }[]) =>
  sessions.reduce((sum, session) => sum + session.duration_minutes, 0)

/**
 * El archivo que se descarga: tus ajustes, progreso con notas, lecciones leídas, sesiones y
 * conversaciones con el tutor (cada una con sus mensajes), más un resumen para revisarlo de un
 * vistazo. Cada registro lleva el id de su ruta.
 */
export function buildExport(rows: ExportRows, meta: { email: string; now: Date }) {
  const messagesByConversation = new Map<
    string,
    Omit<ExportRows['messages'][number], 'user_id'>[]
  >()
  for (const message of rows.messages) {
    const list = messagesByConversation.get(message.conversation_id) ?? []
    list.push(withoutUser(message))
    messagesByConversation.set(message.conversation_id, list)
  }
  const track = trackLookup(rows)
  const topics = rows.topicProgress.map((topic) => ({
    ...withoutUser(topic),
    ruta: track.ofTarget(topic.topic_id, null),
  }))
  const sessions = rows.sessions.map((session) => ({
    ...withoutUser(session),
    ruta: track.ofTarget(session.topic_id, session.project_phase_id),
  }))

  return {
    app: 'LearnAI',
    formato: EXPORT_FORMAT,
    exportado_en: meta.now.toISOString(),
    cuenta: meta.email,
    resumen: {
      sesiones: rows.sessions.length,
      minutos_estudiados: minutesOf(rows.sessions),
      temas_con_notas: rows.topicProgress.filter((topic) => topic.notes.trim() !== '').length,
      temas_hechos: rows.topicProgress.filter((topic) => topic.status === 'hecho').length,
      lecciones_leidas: rows.lessons.filter((lesson) => lesson.read_at !== null).length,
      conversaciones_con_el_tutor: rows.conversations.length,
      mensajes_con_el_tutor: rows.messages.length,
      quizzes: rows.quizResults.length,
    },
    rutas: rows.tracks.map(({ id, title, goal }) => {
      const own = sessions.filter((session) => session.ruta === id)
      return {
        id,
        titulo: title,
        meta: goal,
        temas_hechos: topics.filter((topic) => topic.ruta === id && topic.status === 'hecho')
          .length,
        sesiones: own.length,
        minutos_estudiados: minutesOf(own),
      }
    }),
    ajustes: rows.settings ? withoutUser(rows.settings) : null,
    progreso: {
      temas: topics,
      proyectos: rows.projectProgress.map((project) => ({
        ...withoutUser(project),
        ruta: track.ofTarget(null, project.phase_id),
      })),
      checklist: rows.checklist.map((item) => ({
        ...withoutUser(item),
        ruta: track.ofItem(item.item_id),
      })),
      lecciones: rows.lessons.map((lesson) => ({
        ...withoutUser(lesson),
        ruta: track.ofTarget(lesson.topic_id, null),
      })),
    },
    sesiones: sessions,
    tutor: {
      conversaciones: rows.conversations.map((conversation) => ({
        ...withoutUser(conversation),
        ruta: track.ofTarget(conversation.topic_id, conversation.phase_id),
        mensajes: messagesByConversation.get(conversation.id) ?? [],
      })),
      quizzes: rows.quizResults.map((quiz) => ({
        ...withoutUser(quiz),
        ruta: track.ofTarget(quiz.topic_id, null),
      })),
    },
  }
}

export function exportFileName(day: string): string {
  return `learnai-datos-${day}.json`
}
