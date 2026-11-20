import { PageHeader } from '@/components/ui/PageHeader'
import { RoadmapGate } from '@/features/ruta/RoadmapGate'
import { ManualSessionForm } from './ManualSessionForm'

export function ManualSessionPage() {
  return (
    <>
      <PageHeader
        title="Registrar sesión manual"
        description="Para el tiempo que estudiaste sin el temporizador."
        back={{ to: '/estudiar', label: 'Estudiar' }}
      />
      <RoadmapGate>{(data) => <ManualSessionForm {...data} />}</RoadmapGate>
    </>
  )
}
