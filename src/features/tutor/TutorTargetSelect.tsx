import { SelectField } from '@/components/ui/SelectField'
import { phaseLabel } from '@/lib/roadmap'
import type { Phase } from '@/types/curriculum'

interface TutorTargetSelectProps {
  kind: 'topic' | 'project'
  phases: readonly Phase[]
  value: string
  disabled: boolean
  onChange: (id: string) => void
}

/** Tema (Explicar y Quiz) o proyecto (Revisar proyecto) de la conversación. */
export function TutorTargetSelect({
  kind,
  phases,
  value,
  disabled,
  onChange,
}: TutorTargetSelectProps) {
  return (
    <SelectField
      label={kind === 'topic' ? 'Tema' : 'Proyecto'}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {kind === 'topic'
        ? phases.map((phase) => (
            <optgroup key={phase.id} label={`${phaseLabel(phase)} · ${phase.title}`}>
              {phase.topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </optgroup>
          ))
        : phases.map((phase) => (
            <option key={phase.id} value={phase.id}>
              {phaseLabel(phase)} · {phase.project.title}
            </option>
          ))}
    </SelectField>
  )
}
