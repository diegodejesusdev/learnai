import { CircleCheck, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { lessonAssetBase } from '@/lib/lessonImages'
import { useOnline } from '@/lib/offline'
import type { Phase } from '@/types/curriculum'
import type { DownloadState } from './lessonModel'
import { useDownloadLessons, useDownloadState } from './useLessonDownload'

function stateText({ pending, saved, changed }: DownloadState): string {
  const total = pending.length + saved
  const lessons = total === 1 ? '1 lección' : `${total} lecciones`
  if (saved === 0 && changed === 0) return `${lessons}, ninguna en este dispositivo.`
  const base = `${saved} de ${lessons} en este dispositivo.`
  if (changed === 0) return base
  return `${base} ${changed === 1 ? '1 cambió' : `${changed} cambiaron`} desde entonces.`
}

/** Guarda en el dispositivo todas las lecciones de la fase. Sin lecciones, no muestra nada. */
export function DownloadPhase({ phase, trackId }: { phase: Phase; trackId: string }) {
  const state = useDownloadState(phase.topics.map((topic) => topic.id))
  const download = useDownloadLessons()
  const online = useOnline()
  if (!state || state.pending.length + state.saved === 0) return null

  if (state.pending.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <CircleCheck className="size-4 shrink-0 text-fg" />
        {state.saved === 1
          ? 'La lección de esta fase está en este dispositivo.'
          : `Las ${state.saved} lecciones de esta fase están en este dispositivo.`}
      </p>
    )
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        className="py-2.5"
        disabled={!online || download.isPending}
        onClick={() =>
          download.mutate({
            topicIds: state.pending,
            assetBase: lessonAssetBase(trackId, phase.id),
          })
        }
      >
        {download.isPending ? <Spinner /> : <Download className="size-4 shrink-0" />}
        Descargar fase para leer sin conexión
      </Button>
      <p className="text-sm text-fg-muted">
        {online ? stateText(state) : `${stateText(state)} Necesitas conexión para descargar.`}
      </p>
    </div>
  )
}
