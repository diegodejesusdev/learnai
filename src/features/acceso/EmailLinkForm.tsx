import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { sendMagicLink } from './authApi'
import { authErrorMessage } from './authErrors'

interface EmailLinkFormProps {
  enabled: boolean
  onSent: (email: string) => void
}

export function EmailLinkForm({ enabled, onSent }: EmailLinkFormProps) {
  const [email, setEmail] = useState('')
  const mutation = useMutation({
    mutationFn: sendMagicLink,
    onSuccess: (_data, sentTo) => onSent(sentTo),
  })

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate(email.trim())
      }}
    >
      <TextField
        label="Correo"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={!enabled}
      />
      <Button type="submit" size="lg" disabled={!enabled || mutation.isPending}>
        {mutation.isPending ? <Spinner /> : <Mail className="size-5" />}
        Enviarme un enlace
      </Button>
      {mutation.isError && <Alert>{authErrorMessage(mutation.error)}</Alert>}
    </form>
  )
}
