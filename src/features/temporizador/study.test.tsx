import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, fetchUserSettings } from '@/features/ajustes/settingsApi'
import { fetchProgress } from '@/features/ruta/progressApi'
import { emptySnapshot } from '@/features/ruta/progressModel'
import { fetchRoadmap } from '@/features/ruta/roadmapApi'
import { dismissToast, getToasts } from '@/lib/toast'
import { renderApp, roadmapFixture } from '@/test/renderApp'
import {
  deleteActiveTimer,
  fetchActiveTimer,
  finishActiveTimer,
  insertActiveTimer,
  recordManualSession,
  updateActiveTimer,
} from './timerApi'
import { createTimer, type ActiveTimer } from './timerModel'
import { writeStoredTimer } from './timerStorage'

vi.mock('@/features/ruta/roadmapApi', () => ({ fetchRoadmap: vi.fn() }))
vi.mock('@/features/ruta/progressApi', () => ({
  fetchProgress: vi.fn(),
  fetchTopicMinutes: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(fetchRoadmap).mockResolvedValue(roadmapFixture())
  vi.mocked(fetchProgress).mockResolvedValue(emptySnapshot)
  vi.mocked(fetchUserSettings).mockResolvedValue(defaultSettings)
})

afterEach(() => {
  for (const item of getToasts()) dismissToast(item.id)
  vi.clearAllMocks()
})

/** Temporizador que empezó hace `minutesAgo` minutos. */
function runningTimer(minutesAgo: number, overrides: Partial<ActiveTimer> = {}): ActiveTimer {
  return {
    ...createTimer({
      mode: 'pomodoro',
      target: { topicId: 'f1-t5', projectPhaseId: null },
      workMin: 25,
      breakMin: 5,
      now: new Date(Date.now() - minutesAgo * 60_000),
    }),
    ...overrides,
  }
}

describe('empezar una sesión', () => {
  it('por defecto propone el tema que viene en la URL', async () => {
    renderApp('/estudiar?tema=f2-t9')
    expect(await screen.findByText('n8n: manejo de errores')).toBeInTheDocument()
  })

  it('sin tema en la URL propone el siguiente tema sugerido', async () => {
    renderApp('/estudiar')
    expect(await screen.findByText('Qué es un proceso')).toBeInTheDocument()
  })

  it('el buscador cambia el tema y «Iniciar» guarda el temporizador con los minutos de Ajustes', async () => {
    renderApp('/estudiar')
    await userEvent.type(await screen.findByLabelText('Cambiar de tema'), 'webhook')
    await userEvent.click(screen.getByRole('button', { name: /^Webhooks/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    await waitFor(() => expect(insertActiveTimer).toHaveBeenCalled())
    expect(vi.mocked(insertActiveTimer).mock.calls[0]?.[0]).toMatchObject({
      mode: 'pomodoro',
      topicId: 'f1-t5',
      workMin: 25,
      breakMin: 5,
      pausedAt: null,
    })
    expect(await screen.findByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  })
})

describe('con varias rutas', () => {
  const inData = { ...defaultSettings, active_track_id: 'ingenieria-datos' }

  it('propone el siguiente tema de la ruta activa', async () => {
    vi.mocked(fetchUserSettings).mockResolvedValue(inData)
    renderApp('/estudiar')
    expect(await screen.findByText('Roles del mundo de datos')).toBeInTheDocument()
    expect(screen.getByText(/^Ingeniería de datos · Fase 0/)).toBeInTheDocument()
  })

  it('el buscador agrupa los resultados por ruta, con la activa primero', async () => {
    vi.mocked(fetchUserSettings).mockResolvedValue(inData)
    renderApp('/estudiar')
    await userEvent.type(await screen.findByLabelText('Cambiar de tema'), 'api')
    const groups = screen.getAllByRole('list', { name: /^Resultados en/ })
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([
      'Resultados en Ingeniería de datos',
      'Resultados en Automatización para negocios',
      'Resultados en Cloud',
    ])
    expect(
      within(groups[0] as HTMLElement).getByRole('button', { name: /^APIs desde Python/ }),
    ).toBeInTheDocument()
  })

  it('se puede empezar una sesión de la otra ruta', async () => {
    renderApp('/estudiar')
    await userEvent.type(await screen.findByLabelText('Cambiar de tema'), 'estrella')
    await userEvent.click(screen.getByRole('button', { name: /^Modelo estrella/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    await waitFor(() => expect(insertActiveTimer).toHaveBeenCalled())
    expect(vi.mocked(insertActiveTimer).mock.calls[0]?.[0]).toMatchObject({
      topicId: null,
      projectPhaseId: 'de-f1',
    })
    expect(await screen.findByText('Ingeniería de datos · Proyecto · Fase 1')).toBeInTheDocument()
  })

  it('un tema de Cloud se encuentra y se puede empezar', async () => {
    renderApp('/estudiar')
    await userEvent.type(await screen.findByLabelText('Cambiar de tema'), 'cidr')
    const cloud = await screen.findByRole('list', { name: 'Resultados en Cloud' })
    await userEvent.click(within(cloud).getByRole('button', { name: /^IP, subredes y CIDR/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    await waitFor(() => expect(insertActiveTimer).toHaveBeenCalled())
    expect(vi.mocked(insertActiveTimer).mock.calls[0]?.[0]).toMatchObject({
      topicId: 'cl-f1-t8',
      projectPhaseId: null,
    })
  })

  it('el enlace de un tema de la otra ruta manda sobre la activa', async () => {
    renderApp('/estudiar?tema=de-f1-t4')
    expect(await screen.findByText('Funciones de ventana')).toBeInTheDocument()
  })

  it('la sesión manual también propone la ruta activa', async () => {
    vi.mocked(fetchUserSettings).mockResolvedValue(inData)
    renderApp('/estudiar/manual')
    expect(await screen.findByText('Roles del mundo de datos')).toBeInTheDocument()
  })
})

describe('sesión en curso', () => {
  it('muestra el bloque de trabajo con la cuenta regresiva calculada desde el inicio', async () => {
    vi.mocked(fetchActiveTimer).mockResolvedValue(runningTimer(10))
    renderApp('/estudiar')
    expect(await screen.findByRole('timer')).toHaveTextContent(/^1[45]:\d\d$/)
    expect(screen.getByText('Trabajo')).toBeInTheDocument()
  })

  it('pausar guarda la hora de la pausa y el tiempo deja de correr', async () => {
    vi.mocked(fetchActiveTimer).mockResolvedValue(runningTimer(10))
    renderApp('/estudiar')
    await userEvent.click(await screen.findByRole('button', { name: 'Pausar' }))
    expect(await screen.findByRole('button', { name: 'Reanudar' })).toBeInTheDocument()
    expect(screen.getByText('En pausa')).toBeInTheDocument()
    const saved = vi.mocked(updateActiveTimer).mock.calls[0]?.[1]
    expect(saved?.pausedAt).not.toBeNull()
  })

  it('sobrevive a recargar: sin respuesta del servidor, se muestra la copia de localStorage', async () => {
    const timer = runningTimer(3, { mode: 'free' })
    writeStoredTimer({ userId: 'u1', timer, synced: true, changedAt: timer.updatedAt })
    vi.mocked(fetchActiveTimer).mockReturnValue(new Promise(() => {}))
    renderApp('/estudiar')
    expect(await screen.findByRole('timer')).toHaveTextContent(/^0[23]:\d\d$/)
    expect(screen.getByText('Libre')).toBeInTheDocument()
  })

  it('se ve como banner en las demás páginas', async () => {
    vi.mocked(fetchActiveTimer).mockResolvedValue(runningTimer(10))
    renderApp('/ruta')
    expect(await screen.findByRole('link', { name: /Sesión en curso: Webhooks/ })).toHaveAttribute(
      'href',
      '/estudiar',
    )
  })
})

describe('terminar', () => {
  it('con menos de 1 minuto ofrece descartarla', async () => {
    vi.mocked(fetchActiveTimer).mockResolvedValue(runningTimer(0.5))
    renderApp('/estudiar')
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar' }))
    expect(await screen.findByText('La sesión duró menos de 1 minuto')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Descartar sesión' }))
    await waitFor(() => expect(deleteActiveTimer).toHaveBeenCalled())
    expect(finishActiveTimer).not.toHaveBeenCalled()
  })

  it('guarda la duración, las notas y «marcar como hecho»', async () => {
    vi.mocked(fetchActiveTimer).mockResolvedValue(runningTimer(40, { mode: 'free' }))
    renderApp('/estudiar')
    await userEvent.click(await screen.findByRole('button', { name: 'Terminar' }))
    expect(await screen.findByLabelText('Duración (minutos de estudio)')).toHaveValue(40)
    await userEvent.type(
      screen.getByLabelText('¿Qué aprendiste?'),
      'Probar webhooks con webhook.site',
    )
    await userEvent.click(screen.getByLabelText('Marcar «Webhooks» como hecho'))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar sesión' }))
    await waitFor(() => expect(finishActiveTimer).toHaveBeenCalled())
    const timer = runningTimer(40, { mode: 'free' })
    expect(vi.mocked(finishActiveTimer).mock.calls[0]?.[0]).toMatchObject({
      // Con el id y los datos del temporizador: se puede guardar aunque nunca llegara a la base.
      sessionId: expect.any(String) as string,
      mode: 'free',
      topicId: timer.topicId,
      projectPhaseId: null,
      durationMinutes: 40,
      notes: 'Probar webhooks con webhook.site',
      markDone: true,
    })
    expect(await screen.findByText('Sesión guardada: 40 min en «Webhooks».')).toBeInTheDocument()
  })
})

describe('sesión manual', () => {
  it('guarda la fecha y la hora escritas como hora de Colombia', async () => {
    renderApp('/estudiar/manual?tema=f1-t5')
    await screen.findByText('Webhooks')
    await userEvent.clear(screen.getByLabelText('Fecha'))
    await userEvent.type(screen.getByLabelText('Fecha'), '2026-11-17')
    await userEvent.clear(screen.getByLabelText('Hora de inicio'))
    await userEvent.type(screen.getByLabelText('Hora de inicio'), '23:30')
    await userEvent.clear(screen.getByLabelText('Duración (minutos)'))
    await userEvent.type(screen.getByLabelText('Duración (minutos)'), '60')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar sesión' }))
    await waitFor(() => expect(recordManualSession).toHaveBeenCalled())
    expect(vi.mocked(recordManualSession).mock.calls[0]?.[0]).toMatchObject({
      target: { topicId: 'f1-t5', projectPhaseId: null },
      startedAt: '2026-11-18T04:30:00.000Z',
      endedAt: '2026-11-18T05:30:00.000Z',
      durationMinutes: 60,
    })
  })
})
