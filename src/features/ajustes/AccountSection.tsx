import { useMutation } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/acceso/AuthContext'

export function AccountSection() {
  const auth = useAuth()
  // Al cerrar sesión, RequireAuth lleva a /login solo.
  const signOut = useMutation({ mutationFn: auth.signOut })
  const email = auth.status === 'signed_in' ? auth.user.email : null

  return (
    <Section split title="Cuenta">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-fg-muted">
          Sesión iniciada como{' '}
          <strong className="font-bold break-all text-fg">{email ?? 'tu cuenta'}</strong>
        </p>
        <Button variant="secondary" disabled={signOut.isPending} onClick={() => signOut.mutate()}>
          {signOut.isPending ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
          Cerrar sesión
        </Button>
      </div>
      {signOut.isError && <Alert>No se pudo cerrar la sesión. Inténtalo de nuevo.</Alert>}
    </Section>
  )
}
