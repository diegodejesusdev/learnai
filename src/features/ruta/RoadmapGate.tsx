import { Route, TriangleAlert, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import type { ProgressSnapshot } from './progressApi'
import type { Roadmap } from './roadmapApi'
import { useProgress } from './useProgress'
import { useRoadmap } from './useRoadmap'

export interface RoadmapData {
  roadmap: Roadmap
  progress: ProgressSnapshot
}

/** Carga la ruta y tu progreso, y muestra cargando / error / vacía antes del contenido. */
export function RoadmapGate({ children }: { children: (data: RoadmapData) => ReactNode }) {
  const roadmap = useRoadmap()
  const progress = useProgress()

  if (roadmap.isPending || progress.isPending) {
    // Sin conexión y sin copia guardada, la consulta queda en pausa: no se espera para siempre.
    if (roadmap.fetchStatus === 'paused' || progress.fetchStatus === 'paused') {
      return (
        <EmptyState
          icon={WifiOff}
          title="Sin conexión"
          description="Esta sección aún no está guardada en este dispositivo. Ábrela una vez con internet y después podrás verla sin conexión."
        />
      )
    }
    return <LoadingState label="Cargando la ruta…" />
  }
  if (roadmap.isError || progress.isError) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="No pudimos cargar la ruta"
        description="Revisa tu conexión e inténtalo de nuevo."
        action={
          <Button
            onClick={() => {
              void roadmap.refetch()
              void progress.refetch()
            }}
          >
            Reintentar
          </Button>
        }
      />
    )
  }
  if (roadmap.data.phases.length === 0) {
    return (
      <EmptyState
        icon={Route}
        title="La ruta está vacía"
        description="Carga el contenido de curriculum.json con npm run seed."
      />
    )
  }
  return children({ roadmap: roadmap.data, progress: progress.data })
}
