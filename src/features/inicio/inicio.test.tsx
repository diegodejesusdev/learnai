import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, fetchUserSettings } from '@/features/ajustes/settingsApi'
import { fetchDayTotals, fetchWeekTotals } from '@/features/historial/historyApi'
import { fetchLatestSession } from '@/features/historial/sessionsApi'
import { todayKey } from '@/features/historial/useStudyStats'
import { fetchProgress } from '@/features/ruta/progressApi'
import { emptySnapshot, withTopicStatus } from '@/features/ruta/progressModel'
import { fetchRoadmap } from '@/features/ruta/roadmapApi'
import { addDaysToKey, startOfWeekKey } from '@/lib/dates'
import { renderApp, roadmapFixture } from '@/test/renderApp'

vi.mock('@/features/ruta/roadmapApi', () => ({ fetchRoadmap: vi.fn() }))
vi.mock('@/features/ruta/progressApi', () => ({ fetchProgress: vi.fn() }))

const today = todayKey()

beforeEach(() => {
  vi.mocked(fetchRoadmap).mockResolvedValue(roadmapFixture())
  vi.mocked(fetchProgress).mockResolvedValue(emptySnapshot)
  vi.mocked(fetchUserSettings).mockResolvedValue(defaultSettings)
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
    expect(screen.getByRole('link', { name: '¿Qué estudio hoy?' })).toHaveAttribute(
      'href',
      '/tutor?modo=hoy',
    )
  })

  describe('con varias rutas', () => {
    const NOW = '2026-11-20T15:00:00.000Z'
    const inData = { ...defaultSettings, active_track_id: 'ingenieria-datos' }

    it('muestra el progreso de cada ruta y enlaza a ella', async () => {
      const progress = withTopicStatus(
        withTopicStatus(emptySnapshot, 'f0-t1', 'hecho', NOW),
        'de-f0-t1',
        'hecho',
        NOW,
      )
      vi.mocked(fetchProgress).mockResolvedValue(withTopicStatus(progress, 'f0-t2', 'hecho', NOW))
      renderApp('/')
      const automation = await screen.findByRole('link', { name: /Automatización para negocios/ })
      expect(automation).toHaveTextContent('2 de 100 temas hechos')
      expect(automation).toHaveAttribute('href', '/ruta?ruta=automatizacion')
      const data = screen.getByRole('link', { name: /Ingeniería de datos/ })
      expect(data).toHaveTextContent('1 de 110 temas hechos')
      expect(data).toHaveAttribute('href', '/ruta?ruta=ingenieria-datos')
      // Con texto, no solo con color: cuál es la activa.
      expect(automation).toHaveTextContent('Activa')
      expect(data).not.toHaveTextContent('Activa')
      const cloud = screen.getByRole('link', { name: /Cloud/ })
      expect(cloud).toHaveTextContent('0 de 122 temas hechos')
      expect(cloud).toHaveAttribute('href', '/ruta?ruta=cloud')
      expect(cloud).not.toHaveTextContent('Activa')
    })

    it('con Cloud activa, propone su siguiente tema', async () => {
      vi.mocked(fetchUserSettings).mockResolvedValue({
        ...defaultSettings,
        active_track_id: 'cloud',
      })
      renderApp('/')
      const link = await screen.findByRole('link', { name: 'Empezar a estudiar' })
      expect(link).toHaveAttribute('href', '/estudiar?tema=cl-f0-t1')
      expect(screen.getByText(/^Siguiente tema · Cloud · Fase 0/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /122 temas hechos/ })).toHaveTextContent('Activa')
    })

    it('el siguiente tema sale de la ruta activa y dice cuál es', async () => {
      vi.mocked(fetchUserSettings).mockResolvedValue(inData)
      renderApp('/')
      const link = await screen.findByRole('link', { name: 'Empezar a estudiar' })
      expect(link).toHaveAttribute('href', '/estudiar?tema=de-f0-t1')
      expect(screen.getByText(/^Siguiente tema · Ingeniería de datos · Fase 0/)).toBeInTheDocument()
    })

    it('«Seguir estudiando» retoma la última sesión aunque sea de la otra ruta', async () => {
      vi.mocked(fetchUserSettings).mockResolvedValue(inData)
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
      expect(await screen.findByRole('link', { name: 'Seguir estudiando' })).toHaveAttribute(
        'href',
        '/estudiar?tema=f1-t5',
      )
      expect(
        screen.getByText(/^Tu última sesión, hoy · Automatización para negocios · Fase 1/),
      ).toBeInTheDocument()
      // Y el siguiente de la activa, aparte.
      expect(screen.getByRole('link', { name: 'Estudiar este tema' })).toHaveAttribute(
        'href',
        '/estudiar?tema=de-f0-t1',
      )
    })

    it('los minutos de hoy son los de todas las rutas', async () => {
      vi.mocked(fetchUserSettings).mockResolvedValue(inData)
      vi.mocked(fetchDayTotals).mockResolvedValue([{ day: today, minutes: 70, sessions: 2 }])
      renderApp('/')
      expect(await screen.findByText('1 h 10 min')).toBeInTheDocument()
    })
  })
})
