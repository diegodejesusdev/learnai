import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Logo } from '@/components/layout/Brand'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
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
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <title>Entrar · LearnAI</title>
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo className="size-14" />
          <h1 className="text-2xl font-semibold tracking-tight">Entrar a LearnAI</h1>
          <p className="text-sm text-fg-muted">Tu ruta de automatización para negocios</p>
        </div>
        <Card className="flex w-full flex-col gap-5">
          {urlError && <Alert>{urlError}</Alert>}
          {sentTo ? (
            <EmailCodeForm email={sentTo} onBack={() => setSentTo(null)} />
          ) : (
            <>
              <GoogleButton status={googleStatus} />
              <div className="flex items-center gap-3 text-xs text-fg-muted">
                <span className="h-px flex-1 bg-border" />o con tu correo
                <span className="h-px flex-1 bg-border" />
              </div>
              <EmailLinkForm enabled={emailEnabled} onSent={setSentTo} />
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
