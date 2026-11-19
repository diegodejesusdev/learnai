import { CircleCheck, CircleDashed, CircleDot, MessageCircle, Play } from 'lucide-react'
import { useState } from 'react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { statusLabels } from '@/lib/labels'
import type { ProgressStatus } from '@/types/progress'

const statusOptions: readonly SegmentedOption<ProgressStatus>[] = [
  { value: 'pendiente', label: statusLabels.pendiente, icon: CircleDashed },
  { value: 'en_curso', label: statusLabels.en_curso, icon: CircleDot },
  { value: 'hecho', label: statusLabels.hecho, icon: CircleCheck },
]

interface TopicDetailProps {
  topicId: string
  initialStatus: ProgressStatus
}

export function TopicDetail({ topicId, initialStatus }: TopicDetailProps) {
  // Estado local de ejemplo: se guarda en topic_progress desde la fase 3.
  const [status, setStatus] = useState(initialStatus)
  const [notes, setNotes] = useState('')

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Estado</h2>
        <SegmentedControl
          label="Estado del tema"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
      </Card>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ButtonLink to={`/estudiar?tema=${topicId}`} size="lg">
          <Play className="size-5" />
          Estudiar este tema
        </ButtonLink>
        <ButtonLink to={`/tutor?tema=${topicId}`} variant="secondary" size="lg">
          <MessageCircle className="size-5" />
          Preguntar al tutor
        </ButtonLink>
      </div>
      <Card>
        <TextAreaField
          label="Mis notas"
          hint="Vista previa: las notas se guardarán automáticamente desde la fase 3."
          placeholder="Ideas clave, enlaces, dudas para el tutor…"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Card>
    </div>
  )
}
