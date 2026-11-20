import type { ExportRows } from './exportApi'

/** Versión del formato del archivo, por si algún día cambia. */
export const EXPORT_FORMAT = 1

/** Quita user_id: en un archivo de una sola persona no aporta nada. */
function withoutUser<T extends { user_id: string }>(row: T): Omit<T, 'user_id'> {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'user_id')) as Omit<
    T,
    'user_id'
  >
}

/**
 * El archivo que se descarga: tus ajustes, progreso con notas, sesiones y conversaciones con
 * el tutor (cada una con sus mensajes), más un resumen para revisarlo de un vistazo.
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
  return {
    app: 'LearnAI',
    formato: EXPORT_FORMAT,
    exportado_en: meta.now.toISOString(),
    cuenta: meta.email,
    resumen: {
      sesiones: rows.sessions.length,
      minutos_estudiados: rows.sessions.reduce((sum, session) => sum + session.duration_minutes, 0),
      temas_con_notas: rows.topicProgress.filter((topic) => topic.notes.trim() !== '').length,
      temas_hechos: rows.topicProgress.filter((topic) => topic.status === 'hecho').length,
      conversaciones_con_el_tutor: rows.conversations.length,
      mensajes_con_el_tutor: rows.messages.length,
      quizzes: rows.quizResults.length,
    },
    ajustes: rows.settings ? withoutUser(rows.settings) : null,
    progreso: {
      temas: rows.topicProgress.map(withoutUser),
      proyectos: rows.projectProgress.map(withoutUser),
      checklist: rows.checklist.map(withoutUser),
    },
    sesiones: rows.sessions.map(withoutUser),
    tutor: {
      conversaciones: rows.conversations.map((conversation) => ({
        ...withoutUser(conversation),
        mensajes: messagesByConversation.get(conversation.id) ?? [],
      })),
      quizzes: rows.quizResults.map(withoutUser),
    },
  }
}

export function exportFileName(day: string): string {
  return `learnai-datos-${day}.json`
}
