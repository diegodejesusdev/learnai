import type { RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/ui/LoadingState'
import { LoginPage } from '@/features/acceso/LoginPage'
import { RequireAuth } from '@/features/acceso/RequireAuth'
import { HomePage } from '@/features/inicio/HomePage'
import { NotFoundPage } from './NotFoundPage'
import { RouteErrorPage } from './RouteErrorPage'
import { TutorRoute } from './TutorRoute'

// Inicio y el login van en el fragmento principal; cada otra sección se descarga al abrirla
// (el service worker las deja guardadas, así que también abren sin conexión).
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    // Todo lo demás exige sesión.
    path: '/',
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppShell />,
        // Mientras se descarga la sección.
        hydrateFallbackElement: <LoadingState />,
        children: [
          { index: true, element: <HomePage /> },
          {
            path: 'ruta',
            lazy: () =>
              import('@/features/ruta/RoadmapPage').then((m) => ({ Component: m.RoadmapPage })),
          },
          {
            path: 'ruta/:phaseId',
            lazy: () =>
              import('@/features/ruta/PhasePage').then((m) => ({ Component: m.PhasePage })),
          },
          {
            path: 'ruta/tema/:topicId',
            lazy: () =>
              import('@/features/ruta/TopicPage').then((m) => ({ Component: m.TopicPage })),
          },
          {
            path: 'estudiar',
            lazy: () =>
              import('@/features/temporizador/StudyPage').then((m) => ({
                Component: m.StudyPage,
              })),
          },
          {
            path: 'estudiar/manual',
            lazy: () =>
              import('@/features/temporizador/ManualSessionPage').then((m) => ({
                Component: m.ManualSessionPage,
              })),
          },
          {
            path: 'historial',
            lazy: () =>
              import('@/features/historial/HistoryPage').then((m) => ({
                Component: m.HistoryPage,
              })),
          },
          {
            path: 'historial/sesion/:sessionId',
            lazy: () =>
              import('@/features/historial/SessionEditPage').then((m) => ({
                Component: m.SessionEditPage,
              })),
          },
          { path: 'tutor', element: <TutorRoute /> },
          {
            path: 'ajustes',
            lazy: () =>
              import('@/features/ajustes/SettingsPage').then((m) => ({
                Component: m.SettingsPage,
              })),
          },
          {
            path: 'ajustes/diseno',
            lazy: () =>
              import('@/features/ajustes/DesignSystemPage').then((m) => ({
                Component: m.DesignSystemPage,
              })),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
