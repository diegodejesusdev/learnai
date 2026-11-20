import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { phases } from '@/data/curriculum'
import { fetchAuthProviders } from '@/features/acceso/authApi'
import { saveUserSettings } from '@/features/ajustes/settingsApi'
import { fetchProgress } from '@/features/ruta/progressApi'
import { emptySnapshot } from '@/features/ruta/progressModel'
import { fetchRoadmap } from '@/features/ruta/roadmapApi'
import { renderApp, roadmapFixture, signedOut } from '@/test/renderApp'

// Nada de red en los tests: se simulan las lecturas que hacen estas pantallas.
vi.mock('@/features/ruta/roadmapApi', () => ({ fetchRoadmap: vi.fn() }))
vi.mock('@/features/ruta/progressApi', () => ({ fetchProgress: vi.fn() }))
vi.mock('@/features/acceso/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/acceso/authApi')>()),
  fetchAuthProviders: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(fetchRoadmap).mockResolvedValue(roadmapFixture())
  vi.mocked(fetchProgress).mockResolvedValue(emptySnapshot)
  vi.mocked(fetchAuthProviders).mockResolvedValue({ email: true, google: false })
})

describe('acceso', () => {
  it('sin sesión, cualquier ruta muestra solo el login', async () => {
    renderApp('/ruta', signedOut)
    expect(await screen.findByRole('heading', { name: 'Entrar a LearnAI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviarme un enlace' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('si Google no está configurado, su botón se desactiva con una explicación', async () => {
    renderApp('/login', signedOut)
    expect(await screen.findByText(/Google todavía no está configurado/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar con Google/ })).toBeDisabled()
  })

  it('con sesión, /login redirige al inicio', async () => {
    renderApp('/login')
    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  })

  it('mientras se resuelve la sesión se muestra «Cargando…»', () => {
    renderApp('/ruta', { status: 'loading', signOut: vi.fn(() => Promise.resolve()) })
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
  })

  it('Ajustes muestra el correo de la sesión', () => {
    renderApp('/ajustes')
    expect(screen.getByText('diego@prueba.local')).toBeInTheDocument()
  })

  it('Ajustes guarda el mínimo diario para la racha', async () => {
    renderApp('/ajustes')
    const field = await screen.findByLabelText('Mínimo diario para la racha (min)')
    expect(field).toHaveValue(15)
    await userEvent.clear(field)
    await userEvent.type(field, '30')
    // Se guarda con autoguardado (800 ms después de escribir).
    await waitFor(
      () =>
        expect(vi.mocked(saveUserSettings).mock.lastCall?.[0]).toMatchObject({
          streak_min_minutes: 30,
        }),
      { timeout: 2000 },
    )
  })
})

describe('navegación', () => {
  it('muestra las 5 secciones en español y marca la activa', async () => {
    renderApp('/ruta')
    await screen.findByRole('heading', { name: phases[0]?.title })
    // En jsdom no hay CSS: la barra lateral (escritorio) y la inferior (móvil) están en el DOM.
    const [sidebarNav, bottomNav] = screen.getAllByRole('navigation', {
      name: 'Navegación principal',
    })
    if (!sidebarNav || !bottomNav) throw new Error('Faltan las navegaciones')
    const sections = ['Inicio', 'Ruta', 'Estudiar', 'Historial', 'Tutor']
    const labelsOf = (nav: HTMLElement) =>
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent)

    expect(labelsOf(bottomNav)).toEqual(sections)
    expect(labelsOf(sidebarNav)).toEqual([...sections, 'Ajustes'])
    for (const nav of [sidebarNav, bottomNav]) {
      expect(within(nav).getByRole('link', { name: 'Ruta' })).toHaveAttribute(
        'aria-current',
        'page',
      )
    }
  })

  it('si Supabase falla, Ruta ofrece reintentar', async () => {
    vi.mocked(fetchRoadmap).mockRejectedValue(new Error('sin red'))
    renderApp('/ruta')
    expect(await screen.findByText('No pudimos cargar la ruta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('una ruta desconocida muestra el 404 en español', () => {
    renderApp('/no-existe')
    expect(screen.getByText('No encontramos esta página')).toBeInTheDocument()
  })

  it('una fase inexistente también muestra el 404', async () => {
    renderApp('/ruta/f99')
    expect(await screen.findByText('No encontramos esta página')).toBeInTheDocument()
  })
})

describe('tema', () => {
  it('se puede cambiar a oscuro desde Ajustes', async () => {
    renderApp('/ajustes')
    await userEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    await userEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
