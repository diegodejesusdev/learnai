import { CircleCheck, Download, Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { installHelp, isStandalone, promptInstall, useCanInstall } from '@/lib/installPrompt'
import { toast } from '@/lib/toast'

export function InstallAppSection() {
  const canInstall = useCanInstall()
  const help = installHelp({
    standalone: isStandalone(),
    canInstall,
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
  })

  return (
    <Section
      title="Instalar la app"
      description="Abre LearnAI desde su ícono, a pantalla completa y también sin conexión."
    >
      <Card className="flex flex-col gap-3">
        {help === 'installed' && (
          <p className="flex items-center gap-2 text-sm">
            <CircleCheck className="size-5 text-done" />
            Ya estás usando LearnAI instalada.
          </p>
        )}
        {help === 'prompt' && (
          <Button
            className="self-start"
            onClick={() =>
              void promptInstall().then(
                (installed) => installed && toast.success('LearnAI quedó instalada.'),
              )
            }
          >
            <Download className="size-4" />
            Instalar app
          </Button>
        )}
        {help === 'ios' && (
          <>
            <p className="text-sm font-medium">En iPhone o iPad, desde Safari:</p>
            <ol className="flex flex-col gap-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-semibold">1.</span>
                <span>
                  Toca <Share className="inline size-4 align-text-bottom" aria-label="Compartir" />{' '}
                  <strong>Compartir</strong> en la barra de Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">2.</span>
                <span>
                  Elige <SquarePlus className="inline size-4 align-text-bottom" aria-hidden />{' '}
                  <strong>Agregar a inicio</strong> (desliza hacia abajo si no lo ves).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">3.</span>
                <span>
                  Toca <strong>Agregar</strong>.
                </span>
              </li>
            </ol>
            <p className="text-xs text-fg-muted">
              En la app instalada, entra con el código de 6 dígitos del correo: el enlace abre
              Safari y la sesión quedaría allí.
            </p>
          </>
        )}
        {help === 'unsupported' && (
          <p className="text-sm text-fg-muted">
            Este navegador no ofrece instalarla desde aquí. En el celular usa Chrome (Android) o
            Safari (iPhone); en el computador, Chrome o Edge (ícono de instalar en la barra de
            direcciones).
          </p>
        )}
      </Card>
    </Section>
  )
}
