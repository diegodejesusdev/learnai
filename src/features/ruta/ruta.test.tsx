import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { phases } from '@/data/curriculum'
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
})
