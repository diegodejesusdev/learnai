import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Wordmark } from '@/components/layout/Brand'
import { Alert } from '@/components/ui/Alert'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from './AuthContext'
import { fetchAuthProviders } from './authApi'
import { authErrorFromUrl } from './authErrors'
import { EmailCodeForm } from './EmailCodeForm'
import { EmailLinkForm } from './EmailLinkForm'
import { GoogleButton, type GoogleStatus } from './GoogleButton'

function redirectTarget(state: unknown): string {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string'
  ) {
    return state.from
  }
  return '/'
}

export function LoginPage() {
  const auth = useAuth()
  const location = useLocation()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [urlError] = useState(() => authErrorFromUrl(window.location.href))
  const providers = useQuery({
    queryKey: ['auth-providers'],
    queryFn: fetchAuthProviders,
    staleTime: Infinity,
  })

  useEffect(() => {
    // Quita el error de la URL para que no reaparezca al recargar.
    if (urlError) window.history.replaceState(null, '', window.location.pathname)
  }, [urlError])

  if (auth.status === 'signed_in') return <Navigate to={redirectTarget(location.state)} replace />
  if (auth.status === 'loading') return <LoadingState fullScreen />

  // Si no se pudo leer la configuración, se habilitan ambos y el error llega al intentarlo.
  const emailEnabled = providers.data?.email ?? true
  const googleStatus: GoogleStatus = providers.isPending
    ? 'checking'
    : (providers.data?.google ?? true)
      ? 'on'
      : 'off'

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <title>Entrar · LearnAI</title>
      <div
        data-surface="dark"
        className="flex flex-col justify-between gap-16 bg-hero px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-10 text-hero-fg lg:p-14"
      >
        <Wordmark className="text-2xl" />
        <div className="flex flex-col gap-4">
          <h1 className="text-display text-balance">Entrar a LearnAI</h1>
          <p className="text-lg text-hero-muted">Tus rutas de estudio</p>
        </div>
      </div>
      <div className="flex items-start px-6 py-10 lg:items-center lg:p-14">
        <div className="flex w-full max-w-md flex-col gap-6">
          {urlError && <Alert>{urlError}</Alert>}
          {sentTo ? (
            <EmailCodeForm email={sentTo} onBack={() => setSentTo(null)} />
          ) : (
            <>
              <GoogleButton status={googleStatus} />
              <div className="flex items-center gap-4 text-sm text-fg-muted">
                <span className="h-px flex-1 bg-border" />o con tu correo
                <span className="h-px flex-1 bg-border" />
              </div>
              <EmailLinkForm enabled={emailEnabled} onSent={setSentTo} />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
