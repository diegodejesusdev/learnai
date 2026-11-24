import { Route, TriangleAlert, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { useUserSettings } from '@/features/ajustes/useUserSettings'
import { allPhases, resolveActiveTrack, type Track } from '@/lib/roadmap'
import type { ProgressSnapshot } from './progressApi'
import type { Roadmap } from './roadmapApi'
import { useProgress } from './useProgress'
import { useRoadmap } from './useRoadmap'

export interface RoadmapData {
  roadmap: Roadmap
  progress: ProgressSnapshot
  /** La última ruta elegida en la página Ruta. */
  activeTrack: Track
}

/** Lo que necesitan las tarjetas de una sola ruta. */
export interface TrackData {
  track: Track
  progress: ProgressSnapshot
}

/** Carga las rutas y tu progreso, y muestra cargando / error / vacía antes del contenido. */
export function RoadmapGate({ children }: { children: (data: RoadmapData) => ReactNode }) {
  const roadmap = useRoadmap()
  const progress = useProgress()
  const settings = useUserSettings()

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
  // Los ajustes dicen cuál es la ruta activa. Si fallan o no hay conexión, se usa la primera.
  if (settings.isPending && settings.fetchStatus !== 'paused') {
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
  const { tracks } = roadmap.data
  const activeTrack = resolveActiveTrack(tracks, settings.data?.active_track_id)
  if (!activeTrack || allPhases(tracks).length === 0) {
    return (
      <EmptyState
        icon={Route}
        title="Aún no hay rutas"
        description="Carga el contenido de src/data/routes con npm run seed."
      />
    )
  }
  return children({ roadmap: roadmap.data, progress: progress.data, activeTrack })
}
