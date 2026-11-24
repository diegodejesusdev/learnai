import { SearchX } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { RoadmapGate } from '@/features/ruta/RoadmapGate'
import { SessionEditForm } from './SessionEditForm'
import { useSession } from './useSessions'

/** La lista del Historial pasa su URL (con filtros y día) para volver a ella. */
function returnToFrom(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('returnTo' in state)) return null
  const { returnTo } = state
  return typeof returnTo === 'string' && returnTo.startsWith('/historial') ? returnTo : null
}

export function SessionEditPage() {
  const { sessionId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const session = useSession(sessionId)
  const returnTo = returnToFrom(location.state)

  // Si llegaste desde el Historial, se vuelve atrás (con su scroll); si no, se abre el Historial.
  const goBack = () => void (returnTo ? navigate(-1) : navigate('/historial', { replace: true }))

  const data = session.data
  return (
    <>
      <PageHeader
        title="Editar sesión"
        back={{ to: returnTo ?? '/historial', label: 'Historial' }}
      />
      {session.isError ? (
        <ErrorState title="No pudimos cargar la sesión" onRetry={() => void session.refetch()} />
      ) : data === undefined ? (
        <LoadingState />
      ) : data === null ? (
        <EmptyState
          icon={SearchX}
          title="Esta sesión ya no existe"
          description="Puede que la hayas eliminado en otro dispositivo."
          action={<ButtonLink to="/historial">Ir al Historial</ButtonLink>}
        />
      ) : (
        <RoadmapGate>
          {({ roadmap }) => (
            <SessionEditForm session={data} tracks={roadmap.tracks} onDone={goBack} />
          )}
        </RoadmapGate>
      )}
    </>
  )
}
