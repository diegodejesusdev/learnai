import { History } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import type { Phase } from '@/types/curriculum'
import { SessionRow } from './SessionRow'
import type { SessionQuery } from './sessionsApi'
import { useSessionList } from './useSessions'

interface SessionListProps {
  query: SessionQuery
  phases: readonly Phase[]
  filtered: boolean
}

export function SessionList({ query, phases, filtered }: SessionListProps) {
  const list = useSessionList(query)

  if (list.isError && !list.data) {
    return <ErrorState title="No pudimos cargar tus sesiones" onRetry={() => void list.refetch()} />
  }
  if (!list.data) return <LoadingState />

  const sessions = list.data.pages.flat()
  if (sessions.length === 0) {
    return filtered ? (
      <EmptyState
        icon={History}
        title="No hay sesiones con estos filtros"
        description="Prueba con otras fechas o quita los filtros."
      />
    ) : (
      <EmptyState
        icon={History}
        title="Aún no tienes sesiones"
        description="Cuando termines una sesión en Estudiar o registres una a mano, aparecerá aquí."
        action={<ButtonLink to="/estudiar">Empezar a estudiar</ButtonLink>}
      />
    )
  }

  return (
    <Card className={cn('p-2 transition-opacity sm:p-2', list.isPlaceholderData && 'opacity-60')}>
      <ul aria-label="Sesiones" className="divide-y divide-border">
        {sessions.map((session) => (
          <li key={session.id}>
            <SessionRow session={session} phases={phases} />
          </li>
        ))}
      </ul>
      {list.hasNextPage && (
        <Button
          variant="ghost"
          className="mt-1 w-full"
          disabled={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          {list.isFetchingNextPage && <Spinner />}
          Cargar más
        </Button>
      )}
    </Card>
  )
}
