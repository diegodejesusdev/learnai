import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { useSaveUserSettings } from '@/features/ajustes/useUserSettings'
import { findTrack, type Track } from '@/lib/roadmap'

/**
 * La ruta que muestra la página Ruta: la de la URL (?ruta=…) o, si no, la activa. Verla la deja
 * como activa en la cuenta: las pestañas, el menú y los enlaces solo cambian la URL.
 */
export function useShownTrack(
  tracks: readonly Track[],
  activeTrack: Track,
): [Track, (trackId: string) => void] {
  const [params, setParams] = useSearchParams()
  const { mutate: saveSettings } = useSaveUserSettings(
    'No se pudo recordar la ruta elegida. Revisa tu conexión.',
  )
  const requested = findTrack(tracks, params.get('ruta'))
  const requestedId = requested?.id
  const activeId = activeTrack.id
  // Se guarda una vez por elección: si falla, se avisa y no se reintenta sin parar.
  const lastRequested = useRef<string | undefined>(undefined)

  useEffect(() => {
    const isNew = requestedId !== lastRequested.current
    lastRequested.current = requestedId
    if (requestedId && isNew && requestedId !== activeId) {
      saveSettings({ active_track_id: requestedId })
    }
  }, [requestedId, activeId, saveSettings])

  const show = (trackId: string) => {
    setParams(
      (previous) => {
        const updated = new URLSearchParams(previous)
        updated.set('ruta', trackId)
        return updated
      },
      { replace: true, preventScrollReset: true },
    )
  }

  return [requested ?? activeTrack, show]
}
