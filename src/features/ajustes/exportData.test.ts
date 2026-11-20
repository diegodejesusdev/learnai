import { describe, expect, it } from 'vitest'
import type { ExportRows } from './exportApi'
import { buildExport, exportFileName } from './exportData'

const USER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

const rows: ExportRows = {
  settings: {
    user_id: USER,
    weekly_goal_minutes: 600,
    pomodoro_work_min: 25,
    pomodoro_break_min: 5,
    streak_min_minutes: 15,
    theme: 'system',
    updated_at: '2026-11-20T10:00:00Z',
  },
  topicProgress: [
    {
      user_id: USER,
      topic_id: 'f1-t5',
      status: 'en_curso',
      notes: 'Firmas HMAC',
      completed_at: null,
      updated_at: '2026-11-20T10:00:00Z',
    },
    {
      user_id: USER,
      topic_id: 'f0-t1',
      status: 'hecho',
      notes: '  ',
      completed_at: '2026-11-19T10:00:00Z',
      updated_at: '2026-11-19T10:00:00Z',
    },
  ],
  projectProgress: [],
  checklist: [],
  sessions: [
    {
      id: 's1',
      user_id: USER,
      topic_id: 'f1-t5',
      project_phase_id: null,
      started_at: '2026-11-20T13:00:00Z',
      ended_at: '2026-11-20T13:45:00Z',
      duration_minutes: 45,
      mode: 'pomodoro',
      notes: '',
      created_at: '',
      updated_at: '',
    },
    {
      id: 's2',
      user_id: USER,
      topic_id: null,
      project_phase_id: 'f0',
      started_at: '2026-11-19T13:00:00Z',
      ended_at: '2026-11-19T13:30:00Z',
      duration_minutes: 30,
      mode: 'manual',
      notes: 'Proyecto',
      created_at: '',
      updated_at: '',
    },
  ],
  conversations: [
    {
      id: 'c1',
      user_id: USER,
      mode: 'explain',
      topic_id: 'f1-t5',
      phase_id: null,
      title: 'Webhooks',
      created_at: '',
      updated_at: '',
    },
    {
      id: 'c2',
      user_id: USER,
      mode: 'daily_plan',
      topic_id: null,
      phase_id: null,
      title: 'Hoy',
      created_at: '',
      updated_at: '',
    },
  ],
  messages: [
    {
      id: 'm1',
      conversation_id: 'c1',
      user_id: USER,
      role: 'user',
      content: '¿Qué es?',
      model: null,
      tokens_in: null,
      tokens_out: null,
      created_at: '',
    },
    {
      id: 'm2',
      conversation_id: 'c1',
      user_id: USER,
      role: 'assistant',
      content: 'Un aviso',
      model: 'gemini-3.6-flash',
      tokens_in: 900,
      tokens_out: 120,
      created_at: '',
    },
  ],
  quizResults: [],
}

describe('exportar mis datos', () => {
  const data = buildExport(rows, {
    email: 'diego@prueba.local',
    now: new Date('2026-11-20T15:00:00Z'),
  })

  it('incluye un resumen para revisarlo de un vistazo', () => {
    expect(data.resumen).toEqual({
      sesiones: 2,
      minutos_estudiados: 75,
      temas_con_notas: 1,
      temas_hechos: 1,
      conversaciones_con_el_tutor: 2,
      mensajes_con_el_tutor: 2,
      quizzes: 0,
    })
    expect(data).toMatchObject({ app: 'LearnAI', formato: 1, cuenta: 'diego@prueba.local' })
  })

  it('pone los mensajes dentro de su conversación', () => {
    const [webhooks, hoy] = data.tutor.conversaciones
    expect(webhooks?.mensajes.map((message) => message.content)).toEqual(['¿Qué es?', 'Un aviso'])
    expect(hoy?.mensajes).toEqual([])
  })

  it('conserva notas y sesiones, sin el user_id', () => {
    expect(data.progreso.temas[0]).toMatchObject({ topic_id: 'f1-t5', notes: 'Firmas HMAC' })
    expect(JSON.stringify(data)).not.toContain(USER)
  })

  it('el archivo lleva la fecha', () => {
    expect(exportFileName('2026-11-20')).toBe('learnai-datos-2026-11-20.json')
  })
})
