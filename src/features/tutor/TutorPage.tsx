import { PageHeader } from '@/components/ui/PageHeader'
import { RoadmapGate } from '@/features/ruta/RoadmapGate'
import { TutorWorkspace } from './TutorWorkspace'

export function TutorPage() {
  return (
    <>
      <PageHeader title="Tutor" description="Conoce tus rutas, tus notas y tu progreso." />
      <RoadmapGate>{(data) => <TutorWorkspace {...data} />}</RoadmapGate>
    </>
  )
}
