import { SelectField } from '@/components/ui/SelectField'
import { Tabs } from '@/components/ui/Tabs'
import type { Track } from '@/lib/roadmap'

interface TrackSelectorProps {
  tracks: readonly Track[]
  value: string
  onChange: (trackId: string) => void
  panelId: string
}

/** Elegir ruta: pestañas en el PC y menú desplegable en el móvil. Con una sola ruta, nada. */
export function TrackSelector({ tracks, value, onChange, panelId }: TrackSelectorProps) {
  if (tracks.length < 2) return null
  return (
    <>
      <div className="lg:hidden">
        <SelectField label="Ruta" value={value} onChange={(event) => onChange(event.target.value)}>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="hidden lg:block">
        <Tabs
          label="Ruta"
          options={tracks.map((track) => ({ value: track.id, label: track.title }))}
          value={value}
          onChange={onChange}
          panelId={panelId}
        />
      </div>
    </>
  )
}
