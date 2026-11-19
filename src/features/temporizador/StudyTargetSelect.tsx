import { SelectField } from '@/components/ui/SelectField'
import { phaseLabel, phases } from '@/data/curriculum'

/** Valor del destino: "tema:<id>" o "proyecto:<id de fase>". */
export type StudyTarget = `tema:${string}` | `proyecto:${string}`

interface StudyTargetSelectProps {
  value: StudyTarget
  onChange: (value: StudyTarget) => void
}

function isStudyTarget(value: string): value is StudyTarget {
  return value.startsWith('tema:') || value.startsWith('proyecto:')
}

export function StudyTargetSelect({ value, onChange }: StudyTargetSelectProps) {
  return (
    <SelectField
      label="¿Qué vas a estudiar?"
      value={value}
      onChange={(event) => {
        if (isStudyTarget(event.target.value)) onChange(event.target.value)
      }}
    >
      {phases.map((phase) => (
        <optgroup key={phase.id} label={`${phaseLabel(phase)} · ${phase.title}`}>
          {phase.topics.map((topic) => (
            <option key={topic.id} value={`tema:${topic.id}`}>
              {topic.title}
            </option>
          ))}
          <option value={`proyecto:${phase.id}`}>Proyecto: {phase.project.title}</option>
        </optgroup>
      ))}
    </SelectField>
  )
}
