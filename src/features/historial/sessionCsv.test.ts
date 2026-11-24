import { describe, expect, it } from 'vitest'
import { phases, tracks } from '@/data/curriculum'
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
    expect(sessionCsvRow(crossingMidnight, tracks)).toEqual([
      '2026-11-17',
      '23:40',
      '00:25',
      '45',
      'Pomodoro',
      'Automatización para negocios',
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
    const row = sessionCsvRow(project, tracks)
    expect(row[7]).toBe('proyecto')
    expect(row[8]).toBe(phases.find((phase) => phase.id === 'f1')?.project.title)
  })

  it('cada fila lleva su ruta, justo antes de la fase', () => {
    expect(SESSION_CSV_HEADER.indexOf('ruta')).toBe(SESSION_CSV_HEADER.indexOf('fase') - 1)
    const column = SESSION_CSV_HEADER.indexOf('ruta')
    const inData = { ...crossingMidnight, target: { topicId: 'de-f1-t4', projectPhaseId: null } }
    expect(sessionCsvRow(inData, tracks)[column]).toBe('Ingeniería de datos')
    const project = { ...crossingMidnight, target: { topicId: null, projectPhaseId: 'de-f0' } }
    expect(sessionCsvRow(project, tracks)[column]).toBe('Ingeniería de datos')
  })

  it('un tema que ya no está en ninguna ruta no rompe el archivo', () => {
    const orphan = { ...crossingMidnight, target: { topicId: 'x-t1', projectPhaseId: null } }
    const row = sessionCsvRow(orphan, tracks)
    expect(row).toHaveLength(SESSION_CSV_HEADER.length)
    expect(row[SESSION_CSV_HEADER.indexOf('ruta')]).toBe('')
    expect(row[SESSION_CSV_HEADER.indexOf('tema_o_proyecto')]).toBe('x-t1')
  })

  it('el archivo completo escapa comas, comillas y saltos de línea', () => {
    const csv = sessionsCsv([crossingMidnight], tracks)
    const [header, row] = csv.slice(1).split('\r\n')
    expect(header).toBe(SESSION_CSV_HEADER.join(','))
    expect(row).toContain('"Probé un webhook, con ""curl""\ny Postman"')
  })
})
