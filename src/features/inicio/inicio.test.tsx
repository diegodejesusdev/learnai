import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchDayTotals, fetchWeekTotals } from '@/features/historial/historyApi'
import { fetchLatestSession } from '@/features/historial/sessionsApi'
import { todayKey } from '@/features/historial/useStudyStats'
import { fetchProgress } from '@/features/ruta/progressApi'
import { emptySnapshot } from '@/features/ruta/progressModel'
import { fetchRoadmap } from '@/features/ruta/roadmapApi'
import { addDaysToKey, startOfWeekKey } from '@/lib/dates'
import { renderApp, roadmapFixture } from '@/test/renderApp'

vi.mock('@/features/ruta/roadmapApi', () => ({ fetchRoadmap: vi.fn() }))
vi.mock('@/features/ruta/progressApi', () => ({ fetchProgress: vi.fn() }))

const today = todayKey()

beforeEach(() => {
  vi.mocked(fetchRoadmap).mockResolvedValue(roadmapFixture())
  vi.mocked(fetchProgress).mockResolvedValue(emptySnapshot)
  vi.mocked(fetchLatestSession).mockResolvedValue(null)
  vi.mocked(fetchDayTotals).mockResolvedValue([])
  vi.mocked(fetchWeekTotals).mockResolvedValue([])
})

afterEach(() => vi.clearAllMocks())

describe('Inicio', () => {
  it('muestra los minutos de hoy, la racha y la meta semanal reales', async () => {
    vi.mocked(fetchDayTotals).mockResolvedValue([
      { day: addDaysToKey(today, -1), minutes: 40, sessions: 1 },
      { day: today, minutes: 5, sessions: 1 },
    ])
    vi.mocked(fetchWeekTotals).mockResolvedValue([
      { weekStart: startOfWeekKey(today), minutes: 70, sessions: 3 },
    ])
    renderApp('/')
    expect(await screen.findByText('5 min')).toBeInTheDocument()
    // Hoy aún no llega a 15 min, pero la racha de ayer sigue viva.
    expect(screen.getByText('1 día')).toBeInTheDocument()
    expect(screen.getByText('Te faltan 10 min hoy para seguirla.')).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => element?.textContent === '1 h 10 min de 10 h'),
    ).toBeInTheDocument()
  })

  it('«Seguir estudiando» retoma el tema de la última sesión', async () => {
    vi.mocked(fetchLatestSession).mockResolvedValue({
      id: 's1',
      target: { topicId: 'f1-t5', projectPhaseId: null },
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationMinutes: 30,
      mode: 'free',
      notes: '',
    })
    renderApp('/')
    const link = await screen.findByRole('link', { name: 'Seguir estudiando' })
    expect(link).toHaveAttribute('href', '/estudiar?tema=f1-t5')
    expect(screen.getByText(/^Tu última sesión, hoy/)).toBeInTheDocument()
    // El siguiente tema de la ruta es otro: también se sugiere.
    expect(screen.getByRole('link', { name: 'Estudiar este tema' })).toHaveAttribute(
      'href',
      '/estudiar?tema=f0-t1',
    )
  })

  it('sin sesiones propone empezar por el siguiente tema, sin repetirlo', async () => {
    renderApp('/')
    const link = await screen.findByRole('link', { name: 'Empezar a estudiar' })
    expect(link).toHaveAttribute('href', '/estudiar?tema=f0-t1')
    await waitFor(() => expect(screen.getAllByText('Qué es un proceso')).toHaveLength(1))
    expect(screen.queryByRole('link', { name: 'Estudiar este tema' })).not.toBeInTheDocument()
  })
})
