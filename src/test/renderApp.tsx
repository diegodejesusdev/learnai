import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { vi } from 'vitest'
import { routes } from '@/app/routes'
import { ThemeProvider } from '@/app/ThemeProvider'
import { tracks } from '@/data/curriculum'
import { AuthContext, type AuthContextValue } from '@/features/acceso/AuthContext'
import type { Roadmap } from '@/features/ruta/roadmapApi'

export const signedIn: AuthContextValue = {
  status: 'signed_in',
  user: { id: 'u1', email: 'diego@prueba.local' },
  signOut: vi.fn(() => Promise.resolve()),
}

export const signedOut: AuthContextValue = {
  status: 'signed_out',
  signOut: vi.fn(() => Promise.resolve()),
}

/** Las rutas reales (src/data/routes) con la forma que devuelve Supabase. */
export function roadmapFixture(): Roadmap {
  return { tracks: [...tracks] }
}

/** Monta la app completa en una ruta, con sesión simulada y sin red. */
export function renderApp(path: string, auth: AuthContextValue = signedIn) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthContext value={auth}>
          <RouterProvider router={router} />
        </AuthContext>
      </ThemeProvider>
    </QueryClientProvider>,
  )
  return { router, queryClient }
}
