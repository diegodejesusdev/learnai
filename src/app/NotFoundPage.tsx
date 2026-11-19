import { SearchX } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <>
      <title>No encontrada · LearnAI</title>
      <EmptyState
        icon={SearchX}
        title="No encontramos esta página"
        description="Puede que el enlace esté mal escrito o que el contenido ya no exista."
        action={<ButtonLink to="/">Volver al inicio</ButtonLink>}
      />
    </>
  )
}
