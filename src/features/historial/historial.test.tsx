import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, fetchUserSettings } from '@/features/ajustes/settingsApi'
import { fetchProgress } from '@/features/ruta/progressApi'
import { emptySnapshot } from '@/features/ruta/progressModel'
import { fetchRoadmap } from '@/features/ruta/roadmapApi'
import { addDaysToKey, startOfWeekKey, zonedInputToDate } from '@/lib/dates'
import { dismissToast, getToasts } from '@/lib/toast'
import { renderApp, roadmapFixture } from '@/test/renderApp'
import { fetchDayTotals, fetchPhaseTotals, fetchWeekTotals } from './historyApi'
import {
  deleteSession,
  fetchAllSessions,
  fetchSession,
  fetchSessionPage,
  updateSession,
  type StudySession,
} from './sessionsApi'
import { todayKey } from './useStudyStats'

vi.mock('@/features/ruta/roadmapApi', () => ({ fetchRoadmap: vi.fn() }))
vi.mock('@/features/ruta/progressApi', () => ({
  fetchProgress: vi.fn(),
  fetchTopicMinutes: vi.fn(),
}))

const today = todayKey()
const yesterday = addDaysToKey(today, -1)
const twoDaysAgo = addDaysToKey(today, -2)

/** Sesión que empieza a esa hora de Bogotá. */
function session(day: string, time: string, overrides: Partial<StudySession> = {}): StudySession {
  const start = zonedInputToDate(day, time) ?? new Date()
  return {
    id: `s-${day}-${time}`,
    target: { topicId: 'f1-t5', projectPhaseId: null },
    startedAt: start.toISOString(),
    endedAt: new Date(start.getTime() + 30 * 60_000).toISOString(),
    durationMinutes: 30,
    mode: 'pomodoro',
    notes: '',
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(fetchRoadmap).mockResolvedValue(roadmapFixture())
  vi.mocked(fetchProgress).mockResolvedValue(emptySnapshot)
  // clearAllMocks no deshace mockResolvedValue: cada test vuelve a los valores por defecto.
  vi.mocked(fetchUserSettings).mockResolvedValue(defaultSettings)
  vi.mocked(fetchSessionPage).mockResolvedValue([])
  // Hoy 30 min, ayer 20, anteayer 10 (por debajo del mínimo de 15).
  vi.mocked(fetchDayTotals).mockResolvedValue([
    { day: twoDaysAgo, minutes: 10, sessions: 1 },
    { day: yesterday, minutes: 20, sessions: 1 },
    { day: today, minutes: 30, sessions: 1 },
  ])
  vi.mocked(fetchWeekTotals).mockResolvedValue([
    { weekStart: startOfWeekKey(today), minutes: 50, sessions: 2 },
  ])
  vi.mocked(fetchPhaseTotals).mockResolvedValue([{ phaseId: 'f1', minutes: 60, sessions: 3 }])
})

afterEach(() => {
  for (const item of getToasts()) dismissToast(item.id)
  vi.clearAllMocks()
})

function statValue(label: string): string | null | undefined {
  return screen.getByText(label).closest('div')?.nextElementSibling?.textContent
}

describe('resumen', () => {
  it('racha actual y máxima con el mínimo de 15 min, y la meta de la semana', async () => {
    renderApp('/historial')
    await screen.findByText('Racha actual')
    await waitFor(() => expect(statValue('Racha actual')).toBe('2 días'))
    expect(statValue('Racha máxima')).toBe('2 días')
    expect(screen.getByText('Hoy ya cuenta.')).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => element?.textContent === '50 min de 10 h'),
    ).toBeInTheDocument()
  })

  it('el mínimo de Ajustes cambia qué días cuentan', async () => {
    vi.mocked(fetchUserSettings).mockResolvedValue({ ...defaultSettings, streak_min_minutes: 5 })
    renderApp('/historial')
    await screen.findByText('Racha actual')
    await waitFor(() => expect(statValue('Racha actual')).toBe('3 días'))
  })

  it('los minutos por fase también se ven como tabla', async () => {
    renderApp('/historial')
    const table = await screen.findByRole('table', { name: 'Minutos por fase' })
    expect(
      within(table)
        .getByText(/^Fase 1 · /)
        .closest('tr'),
    ).toHaveTextContent('1 h3')
  })
})

describe('mapa de calor', () => {
  it('abre con hoy elegido y al tocar otro día muestra sus sesiones', async () => {
    vi.mocked(fetchSessionPage).mockResolvedValue([session(yesterday, '08:00')])
    renderApp('/historial')
    const todayCell = await screen.findByRole('button', { name: /: 30 min$/ })
    expect(todayCell).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: /: 20 min$/ }))
    expect(await screen.findByText('Cuenta para la racha.')).toBeInTheDocument()
    const daySessions = await screen.findByRole('list', { name: 'Sesiones del día' })
    expect(within(daySessions).getByText('Webhooks')).toBeInTheDocument()
    // Pide las sesiones de ese día de Bogotá: de 00:00 a 00:00 del día siguiente.
    expect(fetchSessionPage).toHaveBeenCalledWith(
      expect.objectContaining({
        from: zonedInputToDate(yesterday, '00:00')?.toISOString(),
        before: zonedInputToDate(today, '00:00')?.toISOString(),
      }),
      0,
      100,
    )
  })

  it('un día por debajo del mínimo dice que no cuenta para la racha', async () => {
    renderApp('/historial')
    await userEvent.click(await screen.findByRole('button', { name: /: 10 min$/ }))
    expect(
      await screen.findByText('No llega al mínimo de 15 min para la racha.'),
    ).toBeInTheDocument()
  })
})

describe('lista de sesiones', () => {
  it('filtra por fase y luego por tema', async () => {
    renderApp('/historial')
    const topicSelect = await screen.findByLabelText('Tema')
    expect(topicSelect).toBeDisabled()

    await userEvent.selectOptions(screen.getByLabelText('Fase'), 'f1')
    await waitFor(() => expect(vi.mocked(fetchSessionPage).mock.lastCall?.[0].phase?.id).toBe('f1'))
    await userEvent.selectOptions(screen.getByLabelText('Tema'), 'tema:f1-t5')
    await waitFor(() =>
      expect(fetchSessionPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ target: { topicId: 'f1-t5', projectPhaseId: null } }),
        0,
      ),
    )
  })

  it('exporta todas las sesiones a CSV con BOM y en hora de Bogotá', async () => {
    vi.mocked(fetchAllSessions).mockResolvedValue([
      session(yesterday, '23:40', { notes: 'Con "comillas", y comas' }),
    ])
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      return 'blob:csv'
    })
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderApp('/historial')
    await userEvent.click(
      await screen.findByRole('button', { name: 'Exportar todas las sesiones a CSV' }),
    )
    await waitFor(() => expect(click).toHaveBeenCalled())
    const bytes = new Uint8Array((await blobs[0]?.arrayBuffer()) ?? new ArrayBuffer(0))
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]) // BOM de UTF-8
    // text() decodifica como UTF-8 y quita el BOM.
    const text = await blobs[0]?.text()
    expect(text?.startsWith('fecha,hora_inicio,hora_fin')).toBe(true)
    expect(text).toContain(`${yesterday},23:40,00:10,30,Pomodoro`)
    expect(text).toContain('"Con ""comillas"", y comas"')
    expect(getToasts().at(-1)?.message).toBe('Exportaste 1 sesión.')
    click.mockRestore()
  })
})

describe('editar y eliminar', () => {
  const original = session(yesterday, '08:00', { id: 's1', notes: 'Notas viejas' })

  it('guarda los cambios de duración y notas', async () => {
    vi.mocked(fetchSession).mockResolvedValue(original)
    renderApp('/historial/sesion/s1')
    const minutes = await screen.findByLabelText('Minutos de estudio')
    await userEvent.clear(minutes)
    await userEvent.type(minutes, '25')
    await userEvent.clear(screen.getByLabelText('Notas'))
    await userEvent.type(screen.getByLabelText('Notas'), 'Repasé webhooks')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(updateSession).toHaveBeenCalled())
    expect(vi.mocked(updateSession).mock.calls[0]).toEqual([
      's1',
      {
        target: original.target,
        startedAt: original.startedAt,
        endedAt: original.endedAt,
        durationMinutes: 25,
        notes: 'Repasé webhooks',
      },
    ])
    expect(await screen.findByRole('heading', { name: 'Historial' })).toBeInTheDocument()
  })

  it('pide confirmación antes de eliminar', async () => {
    vi.mocked(fetchSession).mockResolvedValue(original)
    renderApp('/historial/sesion/s1')
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar sesión' }))
    expect(screen.getByText('¿Eliminar esta sesión?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(deleteSession).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar sesión' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    await waitFor(() => expect(deleteSession).toHaveBeenCalledWith('s1'))
    expect(await screen.findByRole('heading', { name: 'Historial' })).toBeInTheDocument()
  })

  it('una sesión que ya no existe lo dice', async () => {
    vi.mocked(fetchSession).mockResolvedValue(null)
    renderApp('/historial/sesion/no-existe')
    expect(await screen.findByText('Esta sesión ya no existe')).toBeInTheDocument()
  })
})
