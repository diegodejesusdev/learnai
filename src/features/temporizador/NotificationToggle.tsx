import { Bell, BellOff, BellRing } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { notificationState, requestNotifications } from '@/lib/alerts'

/** Pide permiso para avisar con una notificación del navegador al terminar cada bloque. */
export function NotificationToggle() {
  const [state, setState] = useState(notificationState)

  if (state === 'granted') {
    return (
      <p className="flex items-start gap-2 text-sm text-fg-muted">
        <BellRing className="mt-0.5 size-4 shrink-0 text-fg" />
        Notificaciones activadas para el fin de cada bloque.
      </p>
    )
  }
  if (state === 'denied') {
    return (
      <p className="flex items-start gap-2 text-sm text-fg-muted">
        <BellOff className="mt-0.5 size-4 shrink-0" />
        Bloqueaste las notificaciones; actívalas en la configuración del navegador.
      </p>
    )
  }
  if (state === 'unsupported') {
    return (
      <p className="flex items-start gap-2 text-sm text-fg-muted">
        <BellOff className="mt-0.5 size-4 shrink-0" />
        Este navegador no permite notificaciones (en iPhone funcionan con la app instalada).
      </p>
    )
  }
  return (
    <Button
      variant="ghost"
      className="-ml-4 self-start"
      onClick={() => void requestNotifications().then(setState)}
    >
      <Bell className="size-4" />
      Avisarme también con una notificación
    </Button>
  )
}
