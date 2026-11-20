import { lazy, Suspense } from 'react'
import { LoadingState } from '@/components/ui/LoadingState'

// El Tutor (con el Markdown) se descarga solo al abrirlo.
const TutorPage = lazy(() =>
  import('@/features/tutor/TutorPage').then((module) => ({ default: module.TutorPage })),
)

export function TutorRoute() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TutorPage />
    </Suspense>
  )
}
