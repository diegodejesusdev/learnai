import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { curriculum, phases } from '@/data/curriculum'
import { AuthContext, type AuthContextValue } from '@/features/acceso/AuthContext'
import { fetchAuthProviders } from '@/features/acceso/authApi'
import { fetchRoadmap } from '@/features/ruta/roadmapApi'
import { routes } from './routes'
import { ThemeProvider } from './ThemeProvider'

// Nada de red en los tests: se simulan las dos lecturas que hacen estas pantallas.
vi.mock('@/features/ruta/roadmapApi', () => ({ fetchRoadmap: vi.fn() }))
vi.mock('@/features/acceso/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/acceso/authApi')>()),
  fetchAuthProviders: vi.fn(),
}))

const signedIn: AuthContextValue = {
  status: 'signed_in',
  user: { id: 'u1', email: 'diego@prueba.local' },
  signOut: vi.fn(() => Promise.resolve()),
}
const signedOut: AuthContextValue = {
  status: 'signed_out',
  signOut: vi.fn(() => Promise.resolve()),
}

beforeEach(() => {
  vi.mocked(fetchRoadmap).mockResolvedValue({
    title: curriculum.title,
    goal: curriculum.goal,
    phases: [...phases],
    checklist: [...curriculum.final_checklist],
  })
  vi.mocked(fetchAuthProviders).mockResolvedValue({ email: true, google: false })
})

function renderAt(path: string, auth: AuthContextValue = signedIn) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthContext value={auth}>
          <RouterProvider router={router} />
        </AuthContext>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('acceso', () => {
  it('sin sesión, cualquier ruta muestra solo el login', async () => {
    renderAt('/ruta', signedOut)
    expect(await screen.findByRole('heading', { name: 'Entrar a LearnAI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviarme un enlace' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('si Google no está configurado, su botón se desactiva con una explicación', async () => {
    renderAt('/login', signedOut)
    expect(await screen.findByText(/Google todavía no está configurado/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar con Google/ })).toBeDisabled()
  })

  it('con sesión, /login redirige al inicio', async () => {
    renderAt('/login')
    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  })

  it('mientras se resuelve la sesión se muestra «Cargando…»', () => {
    renderAt('/ruta', { status: 'loading', signOut: vi.fn(() => Promise.resolve()) })
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
  })

  it('Ajustes muestra el correo de la sesión', () => {
    renderAt('/ajustes')
    expect(screen.getByText('diego@prueba.local')).toBeInTheDocument()
  })
})

describe('navegación', () => {
  it('muestra las 5 secciones en español y marca la activa', async () => {
    renderAt('/ruta')
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

  it('la página Ruta lista las 9 fases que llegan de Supabase', async () => {
    renderAt('/ruta')
    for (const phase of phases) {
      expect(await screen.findByRole('heading', { name: phase.title })).toBeInTheDocument()
    }
    expect(fetchRoadmap).toHaveBeenCalledTimes(1)
  })

  it('si Supabase falla, Ruta ofrece reintentar', async () => {
    vi.mocked(fetchRoadmap).mockRejectedValue(new Error('sin red'))
    renderAt('/ruta')
    expect(await screen.findByText('No pudimos cargar la ruta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('una ruta desconocida muestra el 404 en español', () => {
    renderAt('/no-existe')
    expect(screen.getByText('No encontramos esta página')).toBeInTheDocument()
  })

  it('una fase inexistente también muestra el 404', async () => {
    renderAt('/ruta/f99')
    expect(await screen.findByText('No encontramos esta página')).toBeInTheDocument()
  })
})

describe('tema', () => {
  it('se puede cambiar a oscuro desde Ajustes', async () => {
    renderAt('/ajustes')
    await userEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    await userEvent.click(screen.getByRole('radio', { name: 'Claro' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
