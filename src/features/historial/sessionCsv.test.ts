import { describe, expect, it } from 'vitest'
import { phases } from '@/data/curriculum'
import { SESSION_CSV_HEADER, sessionCsvRow, sessionsCsv } from './sessionCsv'
import type { StudySession } from './sessionsApi'

const crossingMidnight: StudySession = {
  id: 's1',
  target: { topicId: 'f1-t5', projectPhaseId: null },
  // Martes 17, 23:40 → miércoles 18, 00:25 (Bogotá)
  startedAt: '2026-11-18T04:40:00Z',
  endedAt: '2026-11-18T05:25:00Z',
  durationMinutes: 45,
  mode: 'pomodoro',
  notes: 'Probé un webhook, con "curl"\ny Postman',
}

describe('CSV de sesiones', () => {
  it('fecha y horas en Bogotá; la fecha es la del inicio', () => {
    expect(sessionCsvRow(crossingMidnight, phases)).toEqual([
      '2026-11-17',
      '23:40',
      '00:25',
      '45',
      'Pomodoro',
      'Fase 1 · Bases técnicas: APIs, JSON y webhooks',
      'tema',
      'Webhooks',
      'Probé un webhook, con "curl"\ny Postman',
    ])
  })

  it('las sesiones de proyecto llevan el título del proyecto', () => {
    const project: StudySession = {
      ...crossingMidnight,
      target: { topicId: null, projectPhaseId: 'f1' },
      notes: '',
    }
    const row = sessionCsvRow(project, phases)
    expect(row[6]).toBe('proyecto')
    expect(row[7]).toBe(phases.find((phase) => phase.id === 'f1')?.project.title)
  })

  it('el archivo completo escapa comas, comillas y saltos de línea', () => {
    const csv = sessionsCsv([crossingMidnight], phases)
    const [header, row] = csv.slice(1).split('\r\n')
    expect(header).toBe(SESSION_CSV_HEADER.join(','))
    expect(row).toContain('"Probé un webhook, con ""curl""\ny Postman"')
  })
})
