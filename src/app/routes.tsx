import type { RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/acceso/LoginPage'
import { RequireAuth } from '@/features/acceso/RequireAuth'
import { DesignSystemPage } from '@/features/ajustes/DesignSystemPage'
import { SettingsPage } from '@/features/ajustes/SettingsPage'
import { HistoryPage } from '@/features/historial/HistoryPage'
import { SessionEditPage } from '@/features/historial/SessionEditPage'
import { HomePage } from '@/features/inicio/HomePage'
import { PhasePage } from '@/features/ruta/PhasePage'
import { RoadmapPage } from '@/features/ruta/RoadmapPage'
import { TopicPage } from '@/features/ruta/TopicPage'
import { ManualSessionPage } from '@/features/temporizador/ManualSessionPage'
import { StudyPage } from '@/features/temporizador/StudyPage'
import { TutorPage } from '@/features/tutor/TutorPage'
import { NotFoundPage } from './NotFoundPage'
import { RouteErrorPage } from './RouteErrorPage'

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
        children: [
          { index: true, element: <HomePage /> },
          { path: 'ruta', element: <RoadmapPage /> },
          { path: 'ruta/:phaseId', element: <PhasePage /> },
          { path: 'ruta/tema/:topicId', element: <TopicPage /> },
          { path: 'estudiar', element: <StudyPage /> },
          { path: 'estudiar/manual', element: <ManualSessionPage /> },
          { path: 'historial', element: <HistoryPage /> },
          { path: 'historial/sesion/:sessionId', element: <SessionEditPage /> },
          { path: 'tutor', element: <TutorPage /> },
          { path: 'ajustes', element: <SettingsPage /> },
          { path: 'ajustes/diseno', element: <DesignSystemPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
