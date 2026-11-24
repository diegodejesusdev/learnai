import { SelectField } from '@/components/ui/SelectField'
import { phaseLabel, type Track } from '@/lib/roadmap'

interface TutorTargetSelectProps {
  kind: 'topic' | 'project'
  tracks: readonly Track[]
  /** La ruta del tema o del proyecto elegido. */
  track: Track
  value: string
  disabled: boolean
  onChange: (id: string) => void
  onTrackChange: (trackId: string) => void
}

/** Ruta, y tema (Explicar y Quiz) o proyecto (Revisar proyecto) de la conversación. */
export function TutorTargetSelect({
  kind,
  tracks,
  track,
  value,
  disabled,
  onChange,
  onTrackChange,
}: TutorTargetSelectProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {tracks.length > 1 && (
        <SelectField
          label="Ruta"
          value={track.id}
          disabled={disabled}
          onChange={(event) => onTrackChange(event.target.value)}
        >
          {tracks.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </SelectField>
      )}
      <SelectField
        label={kind === 'topic' ? 'Tema' : 'Proyecto'}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {kind === 'topic'
          ? track.phases.map((phase) => (
              <optgroup key={phase.id} label={`${phaseLabel(phase)} · ${phase.title}`}>
                {phase.topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </optgroup>
            ))
          : track.phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phaseLabel(phase)} · {phase.project.title}
              </option>
            ))}
      </SelectField>
    </div>
  )
}
