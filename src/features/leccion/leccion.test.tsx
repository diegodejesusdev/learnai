import 'fake-indexeddb/auto'
import { onlineManager } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, fetchUserSettings } from '@/features/ajustes/settingsApi'
import { settingsKey } from '@/features/ajustes/useUserSettings'
import { fetchProgress, fetchTopicMinutes } from '@/features/ruta/progressApi'
import { emptySnapshot } from '@/features/ruta/progressModel'
import { fetchRoadmap } from '@/features/ruta/roadmapApi'
import { progressKey } from '@/features/ruta/useProgress'
import { roadmapKey } from '@/features/ruta/useRoadmap'
import { fetchActiveTimer, insertActiveTimer } from '@/features/temporizador/timerApi'
import { createTimer } from '@/features/temporizador/timerModel'
import { dismissToast, getToasts } from '@/lib/toast'
import { renderApp, roadmapFixture } from '@/test/renderApp'
import {
  fetchLesson,
  fetchLessonIndex,
  fetchLessonProgress,
  fetchLessons,
  saveLessonProgress,
  type Lesson,
  type LessonProgressMap,
} from './lessonApi'
import { withLessonProgress } from './lessonModel'
import { clearSavedLessons, readSavedLesson, saveLessons } from './lessonStore'

vi.mock('@/features/ruta/roadmapApi', () => ({ fetchRoadmap: vi.fn() }))
vi.mock('@/features/ruta/progressApi', () => ({
  fetchProgress: vi.fn(),
  fetchTopicMinutes: vi.fn(),
}))

const CONTENT = [
  '## Objetivo',
  '',
  'Entender **qué es** la nube.',
  '',
  '## Explicación',
  '',
  '### Las cinco características',
  '',
  '| Característica | Ejemplo |',
  '| --- | --- |',
  '| Elasticidad | Pasar de 2 a 20 servidores |',
  '',
  '## Ejemplo práctico',
  '',
  '```bash',
  '# Tu identidad',
  'aws sts get-caller-identity --output json',
  '```',
  '',
  '```json',
  '{ "Account": "123456789012" }',
  '```',
  '',
  '```inventado',
  'sin <b>resaltado</b>',
  '```',
  '',
  '## Repaso',
  '',
  '1. ¿Qué es la elasticidad?',
  '',
  '## Respuestas',
  '',
  '1. Crecer o reducir capacidad en minutos.',
  '',
  '## Para profundizar',
  '',
  '- [Definición del NIST](https://csrc.nist.gov/pubs/sp/800/145/final)',
  '- [Otro tema](/ruta/tema/cl-f0-t2)',
].join('\n')

const lesson = (topicId = 'cl-f0-t1', overrides: Partial<Lesson> = {}): Lesson => ({
  topicId,
  content: CONTENT,
  minutes: 25,
  updated: '2026-11-24',
  hash: `hash-${topicId}`,
  ...overrides,
})

const PHASE = [1, 2, 3].map((n) => lesson(`cl-f0-t${n}`))
const URL = '/ruta/tema/cl-f0-t1/leccion'

// «Servidor» en memoria de lo leído.
let read: LessonProgressMap
// Dónde está la lección en la pantalla (jsdom no dibuja: sin esto todo mide 0).
let box = { top: 0, height: 0 }

beforeEach(() => {
  read = {}
  box = { top: 200, height: 4000 }
  vi.mocked(fetchRoadmap).mockResolvedValue(roadmapFixture())
  vi.mocked(fetchProgress).mockResolvedValue(emptySnapshot)
  vi.mocked(fetchTopicMinutes).mockResolvedValue(0)
  vi.mocked(fetchUserSettings).mockResolvedValue(defaultSettings)
  vi.mocked(fetchActiveTimer).mockResolvedValue(null)
  vi.mocked(fetchLessonIndex).mockResolvedValue(
    Object.fromEntries(
      PHASE.map(({ topicId, minutes, updated, hash }) => [
        topicId,
        { topicId, minutes, updated, hash },
      ]),
    ),
  )
  vi.mocked(fetchLesson).mockImplementation((id) =>
    Promise.resolve(PHASE.find((candidate) => candidate.topicId === id) ?? null),
  )
  vi.mocked(fetchLessons).mockImplementation((ids) =>
    Promise.resolve(PHASE.filter((candidate) => ids.includes(candidate.topicId))),
  )
  vi.mocked(fetchLessonProgress).mockImplementation(() => Promise.resolve(read))
  vi.mocked(saveLessonProgress).mockImplementation((input) => {
    read = withLessonProgress(read, input)
    return Promise.resolve()
  })
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const { top, height } = this.tagName === 'ARTICLE' ? box : { top: 0, height: 0 }
    return new DOMRect(0, top, 300, height)
  })
})

afterEach(async () => {
  onlineManager.setOnline(true)
  for (const item of getToasts()) dismissToast(item.id)
  vi.restoreAllMocks()
  vi.clearAllMocks()
  await clearSavedLessons()
})

/** Baja (o sube) hasta que el borde de arriba de la lección quede en `top`. */
async function scrollTo(top: number) {
  box = { ...box, top }
  fireEvent.scroll(window)
  await act(() => new Promise((resolve) => requestAnimationFrame(resolve)))
}

const section = (title: string) => screen.findByRole('heading', { level: 2, name: title })

describe('leer una lección', () => {
  it('muestra el tema, el tiempo estimado y todas sus secciones', async () => {
    renderApp(URL)
    expect(await section('Objetivo')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Qué es la nube' })).toBeInTheDocument()
    expect(screen.getByText('Cloud · Fase 0 · Lección')).toBeInTheDocument()
    expect(screen.getByText('Tiempo estimado: 25 min')).toBeInTheDocument()
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      'Objetivo',
      'Explicación',
      'Ejemplo práctico',
      'Repaso',
      'Respuestas',
      'Para profundizar',
    ])
    expect(
      screen.getByRole('heading', { level: 3, name: 'Las cinco características' }),
    ).toBeInTheDocument()
  })

  it('las tablas se desplazan de lado, también con el teclado', async () => {
    renderApp(URL)
    const scroller = await screen.findByRole('group', { name: 'Tabla' })
    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller).toHaveClass('overflow-x-auto')
    const table = within(scroller).getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Característica' })).toBeInTheDocument()
    expect(
      within(table).getByRole('cell', { name: 'Pasar de 2 a 20 servidores' }),
    ).toBeInTheDocument()
  })

  it('el código va resaltado y se copia tal cual', async () => {
    // userEvent.setup() pone un portapapeles de prueba.
    const user = userEvent.setup()
    renderApp(URL)
    const comment = await screen.findByText('# Tu identidad')
    expect(comment).toHaveClass('token', 'comment')
    expect(screen.getByText('"123456789012"')).toHaveClass('token', 'string')
    // Un bloque ancho se desplaza con las flechas.
    expect(comment.closest('pre')).toHaveAttribute('tabindex', '0')

    expect(screen.getByText('bash')).toBeInTheDocument()
    const [firstCopy] = screen.getAllByRole('button', { name: 'Copiar' })
    if (!firstCopy) throw new Error('Falta el botón Copiar')
    await user.click(firstCopy)
    expect(await screen.findByRole('button', { name: 'Copiado' })).toBeInTheDocument()
    expect((await navigator.clipboard.readText()).trim()).toBe(
      '# Tu identidad\naws sts get-caller-identity --output json',
    )
  })

  it('un lenguaje que no se conoce se ve sin resaltar, y el HTML no se interpreta', async () => {
    renderApp(URL)
    expect(await screen.findByText('sin <b>resaltado</b>')).toBeInTheDocument()
  })

  it('las respuestas están ocultas hasta tocar «Ver respuestas»', async () => {
    renderApp(URL)
    await section('Respuestas')
    expect(screen.queryByText('Crecer o reducir capacidad en minutos.')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ver respuestas' }))
    expect(screen.getByText('Crecer o reducir capacidad en minutos.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar respuestas' }))
    expect(screen.queryByText('Crecer o reducir capacidad en minutos.')).not.toBeInTheDocument()
  })

  it('los enlaces externos abren en otra pestaña; los de la app, no', async () => {
    renderApp(URL)
    const external = await screen.findByRole('link', { name: /Definición del NIST/ })
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
    expect(external).toHaveAccessibleName('Definición del NIST (se abre en otra pestaña)')
    const internal = screen.getByRole('link', { name: 'Otro tema' })
    expect(internal).not.toHaveAttribute('target')
    expect(internal).toHaveAttribute('href', '/ruta/tema/cl-f0-t2')
  })

  it('todas las lecciones de content/ se muestran sin errores', async () => {
    const files = import.meta.glob<string>('../../../content/**/*.md', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
    const texts = Object.values(files)
    expect(texts.length).toBeGreaterThanOrEqual(9)
    for (const text of texts) {
      const content = text.replace(/^---[^]*?\n---\n/, '')
      vi.mocked(fetchLesson).mockResolvedValue(lesson('cl-f0-t1', { content }))
      await clearSavedLessons()
      const { unmount } = renderApp(URL)
      expect(await section('Objetivo')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Ver respuestas' })).toBeInTheDocument()
      unmount()
    }
  })
})

describe('índice', () => {
  it('en el móvil se despliega, lleva a cada sección y se cierra al elegir', async () => {
    const { router } = renderApp(URL)
    const toggle = await screen.findByRole('button', { name: 'En esta lección' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Repaso' })).not.toBeInTheDocument()

    await userEvent.click(toggle)
    const index = screen.getByRole('navigation', { name: 'Índice de la lección' })
    expect(within(index).getByRole('link', { name: 'Las cinco características' })).toHaveAttribute(
      'href',
      `${URL}#las-cinco-caracteristicas`,
    )
    await userEvent.click(within(index).getByRole('link', { name: 'Repaso' }))
    await waitFor(() => expect(router.state.location.hash).toBe('#repaso'))
    expect(document.getElementById('repaso')).toHaveTextContent('Repaso')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('al recargar con una sección en la URL, vuelve a ella', async () => {
    const scrolled: string[] = []
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(function (this: Element) {
      scrolled.push(this.id)
    })
    renderApp(`${URL}#repaso`)
    await section('Repaso')
    await waitFor(() => expect(scrolled).toContain('repaso'))
  })

  it('en el PC está siempre a la vista', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('min-width'),
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    renderApp(URL)
    await section('Objetivo')
    const index = screen.getByRole('navigation', { name: 'Índice de la lección' })
    expect(within(index).getByRole('link', { name: 'Repaso' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'En esta lección' })).not.toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})

describe('estudiar y preguntar', () => {
  it('«Estudiar con temporizador» empieza una sesión de ese tema, sin salir de la lección', async () => {
    const { router } = renderApp(URL)
    await userEvent.click(await screen.findByRole('button', { name: 'Estudiar con temporizador' }))
    await waitFor(() => expect(insertActiveTimer).toHaveBeenCalled())
    expect(vi.mocked(insertActiveTimer).mock.calls[0]?.[0]).toMatchObject({
      mode: 'pomodoro',
      topicId: 'cl-f0-t1',
      projectPhaseId: null,
      workMin: 25,
      breakMin: 5,
    })
    expect(router.state.location.pathname).toBe(URL)
    expect(await screen.findByRole('link', { name: 'Ver la sesión en curso' })).toHaveAttribute(
      'href',
      '/estudiar',
    )
    expect(
      screen.queryByRole('button', { name: 'Estudiar con temporizador' }),
    ).not.toBeInTheDocument()
  })

  it('con una sesión de otro tema no empieza otra encima', async () => {
    vi.mocked(fetchActiveTimer).mockResolvedValue(
      createTimer({
        mode: 'free',
        target: { topicId: 'f1-t5', projectPhaseId: null },
        workMin: 25,
        breakMin: 5,
        now: new Date(),
      }),
    )
    renderApp(URL)
    expect(
      await screen.findByRole('link', { name: 'Ya tienes otra sesión en curso' }),
    ).toHaveAttribute('href', '/estudiar')
  })

  it('el tutor se abre con ese tema', async () => {
    renderApp(URL)
    expect(
      await screen.findByRole('link', { name: 'Preguntarle al tutor sobre esta lección' }),
    ).toHaveAttribute('href', '/tutor?tema=cl-f0-t1')
  })
})

describe('lo leído', () => {
  it('abrirla no la marca', async () => {
    renderApp(URL)
    await section('Objetivo')
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)))
    expect(saveLessonProgress).not.toHaveBeenCalled()
    expect(screen.getByText('Al llegar al final queda marcada como leída.')).toBeInTheDocument()
  })

  it('al bajar guarda hasta dónde vas, y al llegar al final queda leída', async () => {
    renderApp(URL)
    await section('Objetivo')
    // La pantalla mide 768: con el borde en -832 ya pasaron 1600 de 4000 px.
    await scrollTo(-832)
    await waitFor(() =>
      expect(saveLessonProgress).toHaveBeenCalledWith(
        { topicId: 'cl-f0-t1', scrollPct: 40, readAt: null },
        expect.anything(),
      ),
    )
    await scrollTo(-3232)
    await waitFor(() => expect(saveLessonProgress).toHaveBeenCalledTimes(2))
    expect(vi.mocked(saveLessonProgress).mock.calls[1]?.[0]).toMatchObject({
      topicId: 'cl-f0-t1',
      scrollPct: 100,
      readAt: expect.any(String) as string,
    })
    expect(await screen.findByText(/^Leída el /)).toBeInTheDocument()
    expect(screen.getByText('Lección leída')).toHaveAttribute('role', 'status')
  })

  it('una lección que cabe entera en la pantalla queda leída sin bajar', async () => {
    box = { top: 100, height: 400 }
    renderApp(URL)
    await section('Objetivo')
    await waitFor(() => expect(saveLessonProgress).toHaveBeenCalledTimes(1))
  })

  it('si ya estaba leída, releerla no guarda nada', async () => {
    read = { 'cl-f0-t1': { scrollPct: 100, readAt: '2026-11-20T15:00:00Z' } }
    renderApp(URL)
    expect(await screen.findByText('Leída el 20 nov')).toBeInTheDocument()
    await section('Objetivo')
    await scrollTo(-3232)
    expect(saveLessonProgress).not.toHaveBeenCalled()
  })

  it('si no se pudo guardar, avisa y deja de decir que está leída', async () => {
    vi.mocked(saveLessonProgress).mockRejectedValue(new Error('sin permiso'))
    renderApp(URL)
    await section('Objetivo')
    await scrollTo(-3232)
    expect(await screen.findByText('No se pudo marcar la lección como leída.')).toBeInTheDocument()
    expect(screen.queryByText(/^Leída el /)).not.toBeInTheDocument()
  })

  it('la lista de temas marca las lecciones leídas', async () => {
    read = {
      'cl-f0-t1': { scrollPct: 100, readAt: '2026-11-20T15:00:00Z' },
      'cl-f0-t2': { scrollPct: 60, readAt: null },
    }
    renderApp('/ruta/cl-f0')
    const row = await screen.findByRole('link', { name: /^Qué es la nube/ })
    await waitFor(() => expect(within(row).getByText('Lección leída')).toBeInTheDocument())
    expect(screen.getAllByText('Lección leída')).toHaveLength(1)
  })
})

describe('desde la página del tema', () => {
  it('«Estudiar lección» lleva a ella y dice cuánto toma', async () => {
    const { router } = renderApp('/ruta/tema/cl-f0-t1')
    expect(await screen.findByText('25 min')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Estudiar lección' }))
    await waitFor(() => expect(router.state.location.pathname).toBe(URL))
    expect(await section('Objetivo')).toBeInTheDocument()
  })

  it('dice hasta dónde vas', async () => {
    read = { 'cl-f0-t1': { scrollPct: 40, readAt: null } }
    renderApp('/ruta/tema/cl-f0-t1')
    expect(await screen.findByText('25 min · Vas en 40 %')).toBeInTheDocument()
  })

  it('un tema sin lección dice «Lección en preparación» y lo demás sigue igual', async () => {
    renderApp('/ruta/tema/cl-f0-t9')
    expect(await screen.findByText('Lección en preparación')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Estudiar lección' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Estudiar este tema' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Preguntarle al tutor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Mis notas')).toBeInTheDocument()
  })

  it('si no se pudo saber qué lecciones hay, la página del tema funciona igual', async () => {
    vi.mocked(fetchLessonIndex).mockRejectedValue(new Error('sin red'))
    vi.mocked(fetchLessonProgress).mockRejectedValue(new Error('sin red'))
    renderApp('/ruta/tema/cl-f0-t1')
    expect(await screen.findByRole('link', { name: 'Estudiar este tema' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Estudiar lección' })).toBeInTheDocument()
  })

  it('el enlace directo a una lección que no existe también lo dice', async () => {
    renderApp('/ruta/tema/cl-f0-t9/leccion')
    expect(await screen.findByText('Lección en preparación')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al tema' })).toHaveAttribute(
      'href',
      '/ruta/tema/cl-f0-t9',
    )
  })

  it('un tema que no existe es una página no encontrada', async () => {
    renderApp('/ruta/tema/nada/leccion')
    expect(await screen.findByText('No encontramos esta página')).toBeInTheDocument()
  })
})

describe('sin conexión', () => {
  /** Abre la app sin internet, con lo que habría en la caché del dispositivo. */
  function renderOffline(path: string) {
    onlineManager.setOnline(false)
    const app = renderApp(path)
    act(() => {
      app.queryClient.setQueryData(roadmapKey, roadmapFixture())
      app.queryClient.setQueryData(progressKey, emptySnapshot)
      app.queryClient.setQueryData(settingsKey, defaultSettings)
    })
    return app
  }

  it('abrir una lección la deja guardada', async () => {
    renderApp(URL)
    await section('Objetivo')
    await waitFor(async () => expect(await readSavedLesson('cl-f0-t1')).toEqual(lesson()))
  })

  it('una lección ya abierta se lee sin internet', async () => {
    await saveLessons([lesson()])
    renderOffline(URL)
    expect(await section('Objetivo')).toBeInTheDocument()
    expect(fetchLesson).not.toHaveBeenCalled()
  })

  it('y al llegar al final se marca ya, aunque se suba después', async () => {
    await saveLessons([lesson()])
    renderOffline(URL)
    await section('Objetivo')
    await scrollTo(-3232)
    expect(await screen.findByText(/^Leída el /)).toBeInTheDocument()
    expect(saveLessonProgress).not.toHaveBeenCalled()
    act(() => onlineManager.setOnline(true))
    await waitFor(() => expect(saveLessonProgress).toHaveBeenCalledTimes(1))
  })

  it('una que nunca se abrió lo explica', async () => {
    renderOffline(URL)
    expect(await screen.findByText('Esta lección no está en este dispositivo')).toBeInTheDocument()
  })

  it('si la red falla, muestra la copia guardada', async () => {
    await saveLessons([lesson()])
    vi.mocked(fetchLesson).mockRejectedValue(new TypeError('Failed to fetch'))
    renderApp(URL)
    expect(await section('Objetivo')).toBeInTheDocument()
  })

  it('con conexión, la copia vieja se reemplaza por la nueva', async () => {
    await saveLessons([lesson('cl-f0-t1', { content: '## Vieja\n\nx', hash: 'vieja' })])
    renderApp(URL)
    expect(await section('Objetivo')).toBeInTheDocument()
    await waitFor(async () =>
      expect((await readSavedLesson('cl-f0-t1'))?.hash).toBe('hash-cl-f0-t1'),
    )
  })
})

describe('descargar una fase', () => {
  const button = 'Descargar fase para leer sin conexión'

  it('guarda todas sus lecciones de una vez', async () => {
    renderApp('/ruta/cl-f0')
    expect(await screen.findByText('3 lecciones, ninguna en este dispositivo.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: button }))
    expect(
      await screen.findByText('Las 3 lecciones de esta fase están en este dispositivo.'),
    ).toBeInTheDocument()
    expect(fetchLessons).toHaveBeenCalledExactlyOnceWith(['cl-f0-t1', 'cl-f0-t2', 'cl-f0-t3'])
    expect(await readSavedLesson('cl-f0-t3')).toEqual(lesson('cl-f0-t3'))
    expect(screen.queryByRole('button', { name: button })).not.toBeInTheDocument()
  })

  it('solo pide las que faltan o cambiaron', async () => {
    await saveLessons([lesson('cl-f0-t1'), lesson('cl-f0-t2', { hash: 'vieja' })])
    renderApp('/ruta/cl-f0')
    expect(
      await screen.findByText('1 de 3 lecciones en este dispositivo. 1 cambió desde entonces.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: button }))
    await waitFor(() => expect(fetchLessons).toHaveBeenCalledWith(['cl-f0-t2', 'cl-f0-t3']))
  })

  it('sin conexión no se puede, y lo dice', async () => {
    renderApp('/ruta/cl-f0')
    const download = await screen.findByRole('button', { name: button })
    act(() => onlineManager.setOnline(false))
    expect(download).toBeDisabled()
    expect(screen.getByText(/Necesitas conexión para descargar/)).toBeInTheDocument()
  })

  it('si falla, avisa', async () => {
    vi.mocked(fetchLessons).mockRejectedValue(new TypeError('Failed to fetch'))
    renderApp('/ruta/cl-f0')
    await userEvent.click(await screen.findByRole('button', { name: button }))
    expect(await screen.findByText(/No se pudo descargar la fase/)).toBeInTheDocument()
  })

  it('una fase sin lecciones no muestra el botón', async () => {
    renderApp('/ruta/f1')
    await screen.findByText('Temas')
    await waitFor(() => expect(fetchLessonIndex).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: button })).not.toBeInTheDocument()
  })
})
