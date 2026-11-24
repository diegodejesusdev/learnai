import { onlineManager } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { automationTrack, dataTrack, phases } from '@/data/curriculum'
import {
  defaultSettings,
  fetchUserSettings,
  saveUserSettings,
} from '@/features/ajustes/settingsApi'
import { dismissToast, getToasts } from '@/lib/toast'
import { renderApp, roadmapFixture } from '@/test/renderApp'
import {
  fetchProgress,
  fetchTopicMinutes,
  saveChecklistItem,
  saveTopicNotes,
  saveTopicStatus,
  type ProgressSnapshot,
} from './progressApi'
import { withChecklistItem, withTopicNotes, withTopicStatus } from './progressModel'
import { fetchRoadmap } from './roadmapApi'

vi.mock('./roadmapApi', () => ({ fetchRoadmap: vi.fn() }))
vi.mock('./progressApi', () => ({
  fetchProgress: vi.fn(),
  fetchTopicMinutes: vi.fn(),
  saveTopicStatus: vi.fn(),
  saveTopicNotes: vi.fn(),
  saveProject: vi.fn(),
  saveChecklistItem: vi.fn(),
}))

const topic = (status: 'pendiente' | 'en_curso' | 'hecho', notes = '') => ({
  status,
  notes,
  completed_at: status === 'hecho' ? '2026-11-10T12:00:00Z' : null,
})

// f0: 8 temas, dos hechos; f1-t5 en curso.
const snapshot: ProgressSnapshot = {
  topics: {
    'f0-t1': topic('hecho'),
    'f0-t2': topic('hecho'),
    'f1-t5': topic('en_curso', 'webhook.site'),
  },
  projects: {
    f0: { status: 'hecho', repo_url: null, demo_url: null, notes: '', completed_at: null },
  },
  checklist: { c1: { done: true, done_at: '2026-11-12T12:00:00Z' } },
}

// «Servidor» en memoria: lo que se guarda es lo que devuelve la siguiente lectura.
let server: ProgressSnapshot
const NOW = '2026-11-19T15:00:00.000Z'

beforeEach(() => {
  server = structuredClone(snapshot)
  vi.mocked(fetchRoadmap).mockResolvedValue(roadmapFixture())
  vi.mocked(fetchUserSettings).mockResolvedValue(defaultSettings)
  vi.mocked(saveUserSettings).mockResolvedValue()
  vi.mocked(fetchProgress).mockImplementation(() => Promise.resolve(structuredClone(server)))
  vi.mocked(fetchTopicMinutes).mockResolvedValue(0)
  vi.mocked(saveTopicStatus).mockImplementation((id, status) => {
    server = withTopicStatus(server, id, status, NOW)
    return Promise.resolve()
  })
  vi.mocked(saveTopicNotes).mockImplementation((id, notes) => {
    server = withTopicNotes(server, id, notes)
    return Promise.resolve()
  })
  vi.mocked(saveChecklistItem).mockImplementation((id, done) => {
    server = withChecklistItem(server, id, done, NOW)
    return Promise.resolve()
  })
})

afterEach(() => {
  for (const item of getToasts()) dismissToast(item.id)
  vi.clearAllMocks()
})

const topicTitle = (id: string) =>
  phases.flatMap((phase) => phase.topics).find((candidate) => candidate.id === id)?.title ?? ''

const toggleFor = (id: string, label: string) =>
  screen.findByRole('button', { name: new RegExp(`«${topicTitle(id)}»: ${label}`) })

describe('página Ruta', () => {
  it('muestra el progreso total, proyectos y checklist aparte', async () => {
    renderApp('/ruta')
    expect(await screen.findByText('Progreso total · 2 de 100 temas')).toBeInTheDocument()
    expect(screen.getByText('Proyectos:').parentElement).toHaveTextContent('Proyectos: 1/9')
    expect(screen.getByText('Checklist final:').parentElement).toHaveTextContent(
      'Checklist final: 1/14',
    )
  })

  it('sugiere como siguiente tema el primero «en curso»', async () => {
    renderApp('/ruta')
    expect(await screen.findByText(/^Siguiente tema/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Webhooks' })).toBeInTheDocument()
  })

  it('filtra las fases por estado', async () => {
    renderApp('/ruta')
    await screen.findByText('Progreso total · 2 de 100 temas')
    await userEvent.click(screen.getByRole('radio', { name: /En curso/ }))
    // f0 tiene temas hechos y f1 uno en curso: solo esas dos están «en curso».
    const list = screen.getAllByRole('list').find((element) => element.tagName === 'OL')
    if (!list) throw new Error('Falta la lista de fases')
    const titles = within(list)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(titles).toEqual([phases[0]?.title, phases[1]?.title])
  })
})

describe('elegir ruta', () => {
  const inData = { ...defaultSettings, active_track_id: 'ingenieria-datos' }

  it('abre en automatización, con las dos rutas para elegir', async () => {
    renderApp('/ruta')
    const tabs = await screen.findAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Automatización para negocios',
      'Ingeniería de datos',
    ])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox', { name: 'Ruta' })).toHaveValue('automatizacion')
  })

  it('la pestaña cambia de ruta y la recuerda en la cuenta', async () => {
    renderApp('/ruta')
    await userEvent.click(await screen.findByRole('tab', { name: 'Ingeniería de datos' }))
    expect(await screen.findByText('Progreso total · 0 de 110 temas')).toBeInTheDocument()
    expect(screen.getByText('Proyectos:').parentElement).toHaveTextContent('Proyectos: 0/13')
    expect(screen.getByText('Checklist final:').parentElement).toHaveTextContent(
      'Checklist final: 0/15',
    )
    expect(screen.getByText('13 fases')).toBeInTheDocument()
    expect(screen.getByText(dataTrack.goal)).toBeInTheDocument()
    await waitFor(() => expect(saveUserSettings).toHaveBeenCalledTimes(1))
    expect(vi.mocked(saveUserSettings).mock.calls[0]?.[0]).toEqual({
      active_track_id: 'ingenieria-datos',
    })
  })

  it('el menú desplegable del móvil hace lo mismo', async () => {
    renderApp('/ruta')
    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Ruta' }),
      'ingenieria-datos',
    )
    expect(await screen.findByText('Progreso total · 0 de 110 temas')).toBeInTheDocument()
    await waitFor(() =>
      expect(vi.mocked(saveUserSettings).mock.calls[0]?.[0]).toEqual({
        active_track_id: 'ingenieria-datos',
      }),
    )
  })

  it('con las flechas del teclado se pasa de una pestaña a otra', async () => {
    renderApp('/ruta')
    const [first] = await screen.findAllByRole('tab')
    first?.focus()
    await userEvent.keyboard('{ArrowRight}')
    const data = screen.getByRole('tab', { name: 'Ingeniería de datos' })
    await waitFor(() => expect(data).toHaveAttribute('aria-selected', 'true'))
    expect(data).toHaveFocus()
  })

  it('abre en la última elegida, sin volver a guardarla', async () => {
    vi.mocked(fetchUserSettings).mockResolvedValue(inData)
    renderApp('/ruta')
    expect(await screen.findByText('Progreso total · 0 de 110 temas')).toBeInTheDocument()
    expect(saveUserSettings).not.toHaveBeenCalled()
  })

  it('un enlace a una ruta concreta la muestra y la deja como activa', async () => {
    renderApp('/ruta?ruta=ingenieria-datos')
    expect(await screen.findByText('Progreso total · 0 de 110 temas')).toBeInTheDocument()
    await waitFor(() => expect(saveUserSettings).toHaveBeenCalledTimes(1))
  })

  it('una ruta desconocida en la URL se ignora', async () => {
    renderApp('/ruta?ruta=no-existe')
    expect(await screen.findByText('Progreso total · 2 de 100 temas')).toBeInTheDocument()
    expect(saveUserSettings).not.toHaveBeenCalled()
  })

  it('si guardar la elección falla, avisa una vez y la ruta sigue a la vista', async () => {
    vi.mocked(saveUserSettings).mockRejectedValue(new Error('sin red'))
    renderApp('/ruta')
    await userEvent.click(await screen.findByRole('tab', { name: 'Ingeniería de datos' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo recordar la ruta')
    expect(screen.getByText('Progreso total · 0 de 110 temas')).toBeInTheDocument()
    expect(saveUserSettings).toHaveBeenCalledTimes(1)
  })

  it('cambiar de ruta conserva el filtro por estado', async () => {
    renderApp('/ruta?estado=en_curso')
    await userEvent.click(await screen.findByRole('tab', { name: 'Ingeniería de datos' }))
    expect(await screen.findByText('Ninguna fase con ese estado')).toBeInTheDocument()
  })

  it('con una sola ruta no hay nada que elegir', async () => {
    vi.mocked(fetchRoadmap).mockResolvedValue({ tracks: [automationTrack] })
    renderApp('/ruta')
    expect(await screen.findByText('Progreso total · 2 de 100 temas')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Ruta' })).not.toBeInTheDocument()
  })

  it('una ruta sin fases lo dice, en vez de felicitar por haberla terminado', async () => {
    vi.mocked(fetchUserSettings).mockResolvedValue(inData)
    vi.mocked(fetchRoadmap).mockResolvedValue({
      tracks: [automationTrack, { ...dataTrack, phases: [], checklist: [] }],
    })
    renderApp('/ruta')
    expect(await screen.findByText('Esta ruta está vacía')).toBeInTheDocument()
    expect(screen.queryByText(/Completaste todos los temas/)).not.toBeInTheDocument()
    // Se puede volver a la otra.
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('la fase y el tema dicen de qué ruta son y vuelven a ella', async () => {
    renderApp('/ruta/de-f1')
    expect(await screen.findByText('Ingeniería de datos · Fase 1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ruta', current: false })).toHaveAttribute(
      'href',
      '/ruta?ruta=ingenieria-datos',
    )
  })
})

describe('página de fase', () => {
  it('un toque cambia el estado y lo guarda', async () => {
    renderApp('/ruta/f1')
    await userEvent.click(await toggleFor('f1-t1', 'Pendiente'))
    expect(await toggleFor('f1-t1', 'En curso')).toBeInTheDocument()
    expect(saveTopicStatus).toHaveBeenCalledWith('f1-t1', 'en_curso')
    // Otro toque: hecho, y la barra de la fase sube.
    await userEvent.click(await toggleFor('f1-t1', 'En curso'))
    expect(await screen.findByText('Progreso · 1 de 11 temas')).toBeInTheDocument()
  })

  it('es optimista: se ve antes de que responda el servidor', async () => {
    vi.mocked(saveTopicStatus).mockReturnValue(new Promise(() => {}))
    renderApp('/ruta/f1')
    await userEvent.click(await toggleFor('f1-t3', 'Pendiente'))
    expect(await toggleFor('f1-t3', 'En curso')).toBeInTheDocument()
  })

  it('si guardar falla, vuelve al estado anterior y avisa', async () => {
    vi.mocked(saveTopicStatus).mockRejectedValue(new Error('sin red'))
    renderApp('/ruta/f1')
    await userEvent.click(await toggleFor('f1-t2', 'Pendiente'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cambiar el estado del tema',
    )
    expect(await toggleFor('f1-t2', 'Pendiente')).toBeInTheDocument()
  })

  it('el filtro «Hechos» de la URL muestra solo los temas hechos', async () => {
    renderApp('/ruta/f0?estado=hecho')
    await screen.findByText('Progreso · 2 de 8 temas')
    expect(screen.getAllByRole('button', { name: /^Estado de/ })).toHaveLength(2)
    expect(screen.getByRole('radio', { name: /Hechos/ })).toBeChecked()
  })
})

describe('página de tema', () => {
  it('muestra notas, minutos y los botones a Estudiar y al Tutor', async () => {
    renderApp('/ruta/tema/f1-t5')
    expect(await screen.findByLabelText('Mis notas')).toHaveValue('webhook.site')
    expect(await screen.findByText('Aún no has estudiado este tema')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Estudiar este tema' })).toHaveAttribute(
      'href',
      '/estudiar?tema=f1-t5',
    )
    expect(screen.getByRole('link', { name: 'Preguntarle al tutor' })).toHaveAttribute(
      'href',
      '/tutor?tema=f1-t5',
    )
  })

  it('las notas se guardan solas, una vez, y muestran «Guardado»', async () => {
    renderApp('/ruta/tema/f1-t5')
    const notes = await screen.findByLabelText('Mis notas')
    await userEvent.type(notes, ' y Postman')
    expect(screen.getByText('Guardando…')).toBeInTheDocument()
    await waitFor(
      () => expect(saveTopicNotes).toHaveBeenCalledWith('f1-t5', 'webhook.site y Postman'),
      { timeout: 2000 },
    )
    expect(await screen.findByText('Guardado')).toBeInTheDocument()
    // Un solo guardado para toda la frase, no uno por letra.
    expect(saveTopicNotes).toHaveBeenCalledTimes(1)
  })
})

describe('checklist final', () => {
  it('marcar un ítem lo guarda', async () => {
    renderApp('/ruta')
    const item = await screen.findByRole('checkbox', { name: /Consumo cualquier API/ })
    await userEvent.click(item)
    await waitFor(() => expect(item).toBeChecked())
    expect(saveChecklistItem).toHaveBeenCalledWith('c2', true)
    expect(await screen.findByText('2 de 14 logros')).toBeInTheDocument()
  })

  it('cada ruta tiene la suya: marcar una no cambia la cuenta de la otra', async () => {
    renderApp('/ruta?ruta=ingenieria-datos')
    await userEvent.click(await screen.findByRole('checkbox', { name: /plan de ejecución/ }))
    expect(saveChecklistItem).toHaveBeenCalledWith('de-c1', true)
    expect(await screen.findByText('1 de 15 logros')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /Consumo cualquier API/ })).toBeNull()

    await userEvent.click(screen.getByRole('tab', { name: 'Automatización para negocios' }))
    expect(await screen.findByText('1 de 14 logros')).toBeInTheDocument()
  })
})

describe('sin conexión', () => {
  afterEach(() => onlineManager.setOnline(true))

  it('el cambio se ve al instante, espera en la cola y se sube una sola vez al volver', async () => {
    renderApp('/ruta/f1')
    await toggleFor('f1-t1', 'Pendiente')
    act(() => onlineManager.setOnline(false))

    await userEvent.click(await toggleFor('f1-t1', 'Pendiente'))
    expect(await toggleFor('f1-t1', 'En curso')).toBeInTheDocument()
    expect(saveTopicStatus).not.toHaveBeenCalled()
    expect((await screen.findAllByText('Sin conexión · 1 sin subir')).length).toBeGreaterThan(0)

    act(() => onlineManager.setOnline(true))
    await waitFor(() => expect(saveTopicStatus).toHaveBeenCalledTimes(1))
    expect(saveTopicStatus).toHaveBeenCalledWith('f1-t1', 'en_curso')
    expect((await screen.findAllByText('Sincronizado')).length).toBeGreaterThan(0)
    expect(await toggleFor('f1-t1', 'En curso')).toBeInTheDocument()
  })
})
