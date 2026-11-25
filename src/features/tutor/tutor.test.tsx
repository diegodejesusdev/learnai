import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TutorStreamEvent } from '@shared/tutorTypes'
import { defaultSettings, fetchUserSettings } from '@/features/ajustes/settingsApi'
import { fetchProgress, fetchTopicMinutes } from '@/features/ruta/progressApi'
import { emptySnapshot } from '@/features/ruta/progressModel'
import { fetchRoadmap } from '@/features/ruta/roadmapApi'
import { dismissToast, getToasts } from '@/lib/toast'
import { renderApp, roadmapFixture } from '@/test/renderApp'
import {
  appendNotes,
  fetchConversations,
  fetchMessages,
  fetchQuizResults,
  saveQuizResult,
  streamTutor,
  TutorRequestError,
  type TutorMessage,
} from './tutorApi'

vi.mock('@/features/ruta/roadmapApi', () => ({ fetchRoadmap: vi.fn() }))
vi.mock('@/features/ruta/progressApi', () => ({
  fetchProgress: vi.fn(),
  fetchTopicMinutes: vi.fn(),
}))
vi.mock('./tutorApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./tutorApi')>()),
  fetchConversations: vi.fn(),
  fetchMessages: vi.fn(),
  fetchQuizResults: vi.fn(),
  saveQuizResult: vi.fn(),
  appendNotes: vi.fn(),
  streamTutor: vi.fn(),
}))

const CONVERSATION = '0b9f3b1e-7a3c-4f39-9a51-0c1d2e3f4a5b'

function message(
  role: 'user' | 'assistant',
  content: string,
  id = `${role}-${content.length}`,
): TutorMessage {
  return { id, role, content, createdAt: '2026-11-20T15:00:00Z' }
}

const quizJson = JSON.stringify({
  questions: [1, 2, 3, 4, 5].map((n) => ({
    question: `¿Pregunta ${n}?`,
    options: [`A${n}`, `B${n}`, `C${n}`, `D${n}`],
    correctIndex: 1,
    explanation: `Explicación ${n}`,
  })),
})

/** Simula la Edge Function: entrega los eventos uno tras otro. */
function streamEvents(events: TutorStreamEvent[]) {
  vi.mocked(streamTutor).mockImplementation((_request, _signal, onEvent) => {
    events.forEach(onEvent)
    return Promise.resolve()
  })
}

beforeEach(() => {
  vi.mocked(fetchRoadmap).mockResolvedValue(roadmapFixture())
  vi.mocked(fetchProgress).mockResolvedValue(emptySnapshot)
  vi.mocked(fetchTopicMinutes).mockResolvedValue(0)
  vi.mocked(fetchUserSettings).mockResolvedValue(defaultSettings)
  vi.mocked(fetchConversations).mockResolvedValue([])
  vi.mocked(fetchMessages).mockResolvedValue([])
  vi.mocked(fetchQuizResults).mockResolvedValue([])
  vi.mocked(saveQuizResult).mockResolvedValue()
  vi.mocked(appendNotes).mockResolvedValue()
})

afterEach(() => {
  for (const item of getToasts()) dismissToast(item.id)
  vi.clearAllMocks()
})

describe('elegir modo y tema', () => {
  it('el enlace de un tema abre Explicar con ese tema', async () => {
    renderApp('/tutor?tema=f1-t5')
    expect(await screen.findByLabelText('Tema')).toHaveValue('f1-t5')
    expect(screen.getByRole('radio', { name: 'Explicar' })).toBeChecked()
    expect(await screen.findByText('Pregúntale al tutor sobre «Webhooks»')).toBeInTheDocument()
  })

  it('el enlace de un proyecto abre Revisar proyecto; «Hoy» no pide tema', async () => {
    renderApp('/tutor?proyecto=f2')
    expect(await screen.findByRole('combobox', { name: 'Proyecto' })).toHaveValue('f2')
    await userEvent.click(screen.getByRole('radio', { name: 'Hoy' }))
    expect(screen.queryByRole('combobox', { name: 'Proyecto' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '45 minutos' })).toBeInTheDocument()
  })
})

describe('elegir ruta', () => {
  const inData = { ...defaultSettings, active_track_id: 'ingenieria-datos' }

  it('sin tema en la URL, abre con el siguiente de la ruta activa', async () => {
    vi.mocked(fetchUserSettings).mockResolvedValue(inData)
    renderApp('/tutor')
    expect(await screen.findByLabelText('Ruta')).toHaveValue('ingenieria-datos')
    expect(screen.getByLabelText('Tema')).toHaveValue('de-f0-t1')
  })

  it('el tema de la URL manda: la ruta es la suya, no la activa', async () => {
    vi.mocked(fetchUserSettings).mockResolvedValue(inData)
    renderApp('/tutor?tema=f1-t5')
    expect(await screen.findByLabelText('Ruta')).toHaveValue('automatizacion')
    // Y solo se ofrecen los temas de esa ruta.
    expect(within(screen.getByLabelText('Tema')).getAllByRole('option')).toHaveLength(100)
  })

  it('cambiar de ruta propone su siguiente tema', async () => {
    renderApp('/tutor?tema=f1-t5')
    await userEvent.selectOptions(await screen.findByLabelText('Ruta'), 'ingenieria-datos')
    await waitFor(() => expect(screen.getByLabelText('Tema')).toHaveValue('de-f0-t1'))
    expect(
      await screen.findByText('Pregúntale al tutor sobre «Roles del mundo de datos»'),
    ).toBeInTheDocument()
  })

  it('en Proyecto, la ruta es la del proyecto', async () => {
    renderApp('/tutor?proyecto=de-f1')
    expect(await screen.findByLabelText('Ruta')).toHaveValue('ingenieria-datos')
    const projects = screen.getByRole('combobox', { name: 'Proyecto' })
    expect(projects).toHaveValue('de-f1')
    expect(within(projects).getAllByRole('option')).toHaveLength(13)
  })

  it('los ejemplos para empezar son los de la ruta', async () => {
    renderApp('/tutor?tema=de-f1-t4')
    expect(
      await screen.findByRole('button', { name: 'Dame un ejemplo con datos abiertos de Colombia' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/tienda de barrio/)).not.toBeInTheDocument()
  })

  it('Cloud: sus 122 temas, sus 14 proyectos y sus ejemplos', async () => {
    renderApp('/tutor?tema=cl-f2-t3')
    const track = await screen.findByLabelText('Ruta')
    expect(track).toHaveValue('cloud')
    expect(within(track).getAllByRole('option')).toHaveLength(3)
    expect(within(screen.getByLabelText('Tema')).getAllByRole('option')).toHaveLength(122)
    expect(
      await screen.findByRole('button', { name: 'Compáralo en AWS, Azure y Google Cloud' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Proyecto' }))
    const projects = await screen.findByRole('combobox', { name: 'Proyecto' })
    expect(within(projects).getAllByRole('option')).toHaveLength(14)
    expect(screen.getByPlaceholderText(/Terraform, YAML, políticas IAM/)).toBeInTheDocument()
  })

  it('«Hoy» no pide ruta: puede proponer de cualquiera', async () => {
    renderApp('/tutor?modo=hoy')
    await screen.findByRole('group', { name: 'Tiempo disponible' })
    expect(screen.queryByLabelText('Ruta')).not.toBeInTheDocument()
  })
})

describe('conversar', () => {
  it('envía el mensaje con el tema y muestra la respuesta guardada en Markdown', async () => {
    streamEvents([
      { type: 'start', conversationId: CONVERSATION, userMessageId: 'u1' },
      { type: 'delta', text: 'Un **webhook**' },
      { type: 'done', messageId: 'a1', model: 'demo', remaining: 3 },
    ])
    vi.mocked(fetchMessages).mockResolvedValue([
      message('user', '¿Qué es?'),
      message('assistant', 'Un **webhook** es un aviso.\n\n```json\n{ "pedido": 1 }\n```'),
    ])
    renderApp('/tutor?tema=f1-t5')
    await userEvent.type(await screen.findByLabelText('Mensaje para el tutor'), '¿Qué es?')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(vi.mocked(streamTutor).mock.calls[0]?.[0]).toEqual({
      mode: 'explain',
      topicId: 'f1-t5',
      phaseId: null,
      conversationId: null,
      message: '¿Qué es?',
    })
    expect(await screen.findByText('webhook', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
    expect(screen.getByText('Te quedan 3 mensajes hoy.')).toBeInTheDocument()
    expect(screen.getByLabelText('Mensaje para el tutor')).toHaveValue('')
  })

  it('si llega al límite diario, muestra el mensaje y devuelve el texto a la caja', async () => {
    vi.mocked(streamTutor).mockRejectedValue(
      new TutorRequestError('daily_limit', 'Llegaste al límite de 50 mensajes al tutor por hoy.'),
    )
    renderApp('/tutor?tema=f1-t5')
    await userEvent.type(await screen.findByLabelText('Mensaje para el tutor'), 'Hola')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Llegaste al límite de 50 mensajes')
    expect(screen.getByLabelText('Mensaje para el tutor')).toHaveValue('Hola')
  })

  it('un error del proveedor a mitad del streaming también se muestra', async () => {
    streamEvents([
      { type: 'start', conversationId: CONVERSATION, userMessageId: 'u1' },
      {
        type: 'error',
        code: 'rate_limit',
        message: 'El proveedor de IA recibió demasiadas solicitudes.',
      },
    ])
    renderApp('/tutor?tema=f1-t5')
    await userEvent.type(await screen.findByLabelText('Mensaje para el tutor'), 'Hola')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('demasiadas solicitudes')
  })

  it('guarda un fragmento de la respuesta en las notas del tema', async () => {
    vi.mocked(fetchConversations).mockResolvedValue([
      { id: CONVERSATION, title: 'Webhooks', updatedAt: '2026-11-20T15:00:00Z' },
    ])
    vi.mocked(fetchMessages).mockResolvedValue([message('assistant', 'Valida la firma HMAC.')])
    renderApp('/tutor?tema=f1-t5')
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar en notas' }))
    const draft = screen.getByLabelText('Fragmento para tus notas de «Webhooks»')
    expect(draft).toHaveValue('Valida la firma HMAC.')
    await userEvent.clear(draft)
    await userEvent.type(draft, 'Firma HMAC')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar en notas' }))
    await waitFor(() => expect(appendNotes).toHaveBeenCalled())
    const [target, text] = vi.mocked(appendNotes).mock.calls[0] ?? []
    expect(target).toEqual({ topicId: 'f1-t5' })
    expect(text).toMatch(/^Del tutor \(.+\):\nFirma HMAC$/)
  })
})

describe('quiz', () => {
  it('muestra las preguntas como tarjetas y guarda el puntaje al terminar', async () => {
    vi.mocked(fetchConversations).mockResolvedValue([
      { id: CONVERSATION, title: 'Quiz: Webhooks', updatedAt: '2026-11-20T15:00:00Z' },
    ])
    vi.mocked(fetchMessages).mockResolvedValue([
      message('user', 'Quiz de 5 preguntas sobre el tema.'),
      message('assistant', quizJson, 'quiz-1'),
    ])
    renderApp('/tutor?modo=quiz&tema=f1-t5')
    await screen.findByText('¿Pregunta 1?')
    // Acierta las 4 primeras (B) y falla la última (A).
    for (const n of [1, 2, 3, 4])
      await userEvent.click(screen.getByRole('button', { name: `B. B${n}` }))
    await userEvent.click(screen.getByRole('button', { name: 'A. A5' }))

    expect(screen.getByText('4 de 5')).toBeInTheDocument()
    expect(screen.getByText('Era la B.')).toBeInTheDocument()
    await waitFor(() =>
      expect(saveQuizResult).toHaveBeenCalledWith(
        { messageId: 'quiz-1', topicId: 'f1-t5', score: 4, total: 5, answers: [1, 1, 1, 1, 0] },
        expect.anything(),
      ),
    )
  })

  it('un quiz con JSON inválido muestra un aviso en vez de romper la página', async () => {
    vi.mocked(fetchConversations).mockResolvedValue([
      { id: CONVERSATION, title: 'Quiz: Webhooks', updatedAt: '2026-11-20T15:00:00Z' },
    ])
    vi.mocked(fetchMessages).mockResolvedValue([message('assistant', '{"questions": [', 'quiz-2')])
    renderApp('/tutor?modo=quiz&tema=f1-t5')
    expect(await screen.findByRole('alert')).toHaveTextContent('Este quiz no se pudo leer')
  })

  it('«Nuevo quiz» pide 5 preguntas con el enfoque opcional', async () => {
    streamEvents([])
    renderApp('/tutor?modo=quiz&tema=f1-t5')
    await userEvent.type(await screen.findByLabelText('Enfoque del quiz (opcional)'), 'firmas')
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo quiz' }))
    expect(vi.mocked(streamTutor).mock.calls[0]?.[0]).toMatchObject({
      mode: 'quiz',
      topicId: 'f1-t5',
      message: 'Quiz de 5 preguntas sobre el tema, con énfasis en: firmas',
    })
  })
})

describe('qué estudio hoy', () => {
  it('los atajos de tiempo envían el mensaje sin tema', async () => {
    streamEvents([])
    renderApp('/tutor?modo=hoy')
    const times = await screen.findByRole('group', { name: 'Tiempo disponible' })
    await userEvent.click(within(times).getByRole('button', { name: '1 hora' }))
    expect(vi.mocked(streamTutor).mock.calls[0]?.[0]).toEqual({
      mode: 'daily_plan',
      topicId: null,
      phaseId: null,
      conversationId: null,
      message: 'Tengo 1 hora para estudiar hoy. ¿Qué hago?',
    })
  })
})

describe('panel del PC', () => {
  const PANEL = 'Contexto del tutor'
  const OTHER = '7c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f'

  /** Simula una pantalla ancha (jsdom no tiene matchMedia). */
  function onWideScreen() {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('min-width'),
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  }

  afterEach(() => vi.unstubAllGlobals())

  it('en el móvil no aparece: la conversación se elige en el menú', async () => {
    renderApp('/tutor?tema=f1-t5')
    expect(await screen.findByRole('combobox', { name: 'Conversación' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: PANEL })).not.toBeInTheDocument()
    expect(fetchTopicMinutes).not.toHaveBeenCalled()
  })

  it('muestra lo que sabe del tema: estado, tiempo y notas, con accesos', async () => {
    onWideScreen()
    vi.mocked(fetchTopicMinutes).mockResolvedValue(65)
    vi.mocked(fetchProgress).mockResolvedValue({
      ...emptySnapshot,
      topics: { 'f1-t5': { status: 'en_curso', notes: 'Validar la firma', completed_at: null } },
    })
    renderApp('/tutor?tema=f1-t5')
    const panel = within(await screen.findByRole('complementary', { name: PANEL }))
    expect(panel.getByText('En curso')).toBeInTheDocument()
    expect(await panel.findByText('1 h 5 min estudiados')).toBeInTheDocument()
    expect(panel.getByText('Validar la firma')).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'Ver tema' })).toHaveAttribute(
      'href',
      '/ruta/tema/f1-t5',
    )
    expect(panel.getByRole('link', { name: 'Estudiar este tema' })).toHaveAttribute(
      'href',
      '/estudiar?tema=f1-t5',
    )
  })

  it('sin notas, lo dice', async () => {
    onWideScreen()
    renderApp('/tutor?tema=f1-t5')
    const panel = within(await screen.findByRole('complementary', { name: PANEL }))
    expect(panel.getByText('Aún no tienes notas aquí.')).toBeInTheDocument()
  })

  it('las conversaciones van en una lista: la abierta se marca y otra se abre al tocarla', async () => {
    onWideScreen()
    vi.mocked(fetchConversations).mockResolvedValue([
      { id: CONVERSATION, title: 'Qué es un webhook', updatedAt: '2026-11-20T15:00:00Z' },
      { id: OTHER, title: 'Validar la firma', updatedAt: '2026-11-18T15:00:00Z' },
    ])
    renderApp('/tutor?tema=f1-t5')
    const list = within(await screen.findByRole('list', { name: 'Conversaciones' }))
    expect(screen.queryByRole('combobox', { name: 'Conversación' })).not.toBeInTheDocument()
    expect(list.getByRole('button', { name: /Qué es un webhook/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
    await userEvent.click(list.getByRole('button', { name: /Validar la firma/ }))
    await waitFor(() => expect(fetchMessages).toHaveBeenCalledWith(OTHER))
    expect(list.getByRole('button', { name: /Validar la firma/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Nueva' }))
    expect(await screen.findByText('Pregúntale al tutor sobre «Webhooks»')).toBeInTheDocument()
  })

  it('en Proyecto, muestra el estado y las notas del proyecto', async () => {
    onWideScreen()
    vi.mocked(fetchProgress).mockResolvedValue({
      ...emptySnapshot,
      projects: {
        f2: {
          status: 'hecho',
          repo_url: null,
          demo_url: null,
          notes: 'Falta la alerta',
          completed_at: null,
        },
      },
    })
    renderApp('/tutor?proyecto=f2')
    const panel = within(await screen.findByRole('complementary', { name: PANEL }))
    expect(panel.getByText('Hecho')).toBeInTheDocument()
    expect(panel.getByText('Falta la alerta')).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'Ver proyecto' })).toHaveAttribute('href', '/ruta/f2')
  })

  it('en Hoy, muestra el avance y el siguiente tema de cada ruta', async () => {
    onWideScreen()
    vi.mocked(fetchProgress).mockResolvedValue({
      ...emptySnapshot,
      topics: { 'f0-t1': { status: 'hecho', notes: '', completed_at: null } },
    })
    renderApp('/tutor?modo=hoy')
    const panel = within(await screen.findByRole('complementary', { name: PANEL }))
    expect(panel.getByText('1 de 100 temas')).toBeInTheDocument()
    expect(panel.getByText('0 de 110 temas')).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'Mapeo de procesos y BPMN básico' })).toHaveAttribute(
      'href',
      '/ruta/tema/f0-t2',
    )
    expect(panel.getByRole('link', { name: 'Roles del mundo de datos' })).toBeInTheDocument()
    expect(panel.getByText('0 de 122 temas')).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'Qué es la nube' })).toBeInTheDocument()
  })
})
