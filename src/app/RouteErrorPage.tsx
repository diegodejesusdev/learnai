import { TriangleAlert } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { EmptyState } from '@/components/ui/EmptyState'

/** Pantalla de error en español (reemplaza la de React Router, que está en inglés). */
export function RouteErrorPage() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : undefined

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <title>Error · LearnAI</title>
      <div className="w-full">
        <EmptyState
          icon={TriangleAlert}
          title="Algo salió mal"
          description={
            detail ? `Detalle: ${detail}` : 'Recarga la página para intentarlo de nuevo.'
          }
          action={
            <a href="/" className="font-medium text-accent underline-offset-2 hover:underline">
              Volver al inicio
            </a>
          }
        />
      </div>
    </main>
  )
}
