import { TriangleAlert } from 'lucide-react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

interface ErrorStateProps {
  title: string
  onRetry: () => void
}

/** Algo no cargó: explica y ofrece reintentar. */
export function ErrorState({ title, onRetry }: ErrorStateProps) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title={title}
      description="Revisa tu conexión e inténtalo de nuevo."
      action={<Button onClick={onRetry}>Reintentar</Button>}
    />
  )
}
