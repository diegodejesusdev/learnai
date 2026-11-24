import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { sendMagicLink, verifyEmailCode } from './authApi'
import { authErrorMessage } from './authErrors'

interface EmailCodeFormProps {
  email: string
  onBack: () => void
}

/** Después de enviar el correo: abrir el enlace o escribir el código que trae. */
export function EmailCodeForm({ email, onBack }: EmailCodeFormProps) {
  const [code, setCode] = useState('')
  const verify = useMutation({ mutationFn: () => verifyEmailCode(email, code) })
  const resend = useMutation({ mutationFn: () => sendMagicLink(email) })
  const error = verify.error ?? resend.error

  return (
    <div className="flex flex-col gap-4">
      <p className="text-fg-muted">
        Te enviamos un correo a <strong className="font-bold break-all text-fg">{email}</strong>.
        Toca el enlace para entrar, o escribe aquí el código que trae (útil en la app instalada en
        el móvil).
      </p>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          verify.mutate()
        }}
      >
        <TextField
          label="Código"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,8}"
          minLength={6}
          maxLength={8}
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          className="min-h-16 text-center text-3xl font-extrabold tracking-[0.3em] tabular-nums"
        />
        <Button type="submit" size="lg" disabled={verify.isPending || code.length < 6}>
          {verify.isPending && <Spinner />}
          Entrar con el código
        </Button>
      </form>
      {error && <Alert>{authErrorMessage(error)}</Alert>}
      {resend.isSuccess && !error && <Alert tone="success">Te enviamos otro correo.</Alert>}
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between">
        <Button variant="ghost" className="-mx-4" onClick={onBack}>
          Usar otro correo
        </Button>
        <Button
          variant="ghost"
          className="-mx-4"
          disabled={resend.isPending}
          onClick={() => resend.mutate()}
        >
          {resend.isPending && <Spinner />}
          Reenviar correo
        </Button>
      </div>
    </div>
  )
}
