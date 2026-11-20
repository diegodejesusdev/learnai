import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { RoadmapGate } from '@/features/ruta/RoadmapGate'
import { ActiveSession } from './ActiveSession'
import { StudySetup } from './StudySetup'
import { useActiveTimer } from './useActiveTimer'

export function StudyPage() {
  const timer = useActiveTimer()
  // Sin conexión y sin copia local la consulta queda en pausa: se puede empezar igual.
  const loading = timer.isPending && timer.fetchStatus !== 'paused'

  return (
    <>
      <PageHeader
        title="Estudiar"
        description="Elige un tema o un proyecto y empieza una sesión."
      />
      {loading ? (
        <LoadingState />
      ) : timer.data ? (
        <ActiveSession timer={timer.data} />
      ) : (
        <RoadmapGate>{(data) => <StudySetup {...data} />}</RoadmapGate>
      )}
    </>
  )
}
