import type { QueryClient } from '@tanstack/react-query'

// Consultas que dependen de study_sessions. Las usan Estudiar, Historial, Inicio y Ruta, así que
// sus claves viven aquí y no en una feature.

/** Totales por día, semana y fase (funciones study_*_totals). */
export const studyStatsKey = ['study-stats'] as const
/** Listas de sesiones, la del día, la última y cada sesión suelta. */
export const studySessionsKey = ['study-sessions'] as const
/** Minutos por tema (página de cada tema). */
export const topicMinutesKey = ['topic-minutes'] as const

/** Tras guardar, editar o borrar una sesión: refresca totales, listas y minutos por tema. */
export function invalidateSessionQueries(queryClient: QueryClient): void {
  for (const queryKey of [studyStatsKey, studySessionsKey, topicMinutesKey]) {
    void queryClient.invalidateQueries({ queryKey })
  }
}
