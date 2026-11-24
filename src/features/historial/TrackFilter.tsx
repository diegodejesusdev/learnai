import { SelectField } from '@/components/ui/SelectField'
import type { Track } from '@/lib/roadmap'
import { useSessionFilters } from './useSessionFilters'

/** Filtro por ruta de lo que va debajo: los minutos por fase y la lista de sesiones. */
export function TrackFilter({ tracks }: { tracks: readonly Track[] }) {
  const [filters, setFilters] = useSessionFilters()
  return (
    <SelectField
      label="Ruta"
      value={tracks.some((track) => track.id === filters.trackId) ? filters.trackId : ''}
      hint="Filtra las fases y las sesiones de abajo."
      onChange={(event) =>
        // La fase y el tema elegidos son de otra ruta: se limpian.
        setFilters({ ...filters, trackId: event.target.value, phaseId: '', targetKey: '' })
      }
    >
      <option value="">Todas las rutas</option>
      {tracks.map((track) => (
        <option key={track.id} value={track.id}>
          {track.title}
        </option>
      ))}
    </SelectField>
  )
}
