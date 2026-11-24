import { formatDuration } from '@/lib/dates'
import { useTopicMinutes } from './useProgress'

export function TopicMinutes({ topicId }: { topicId: string }) {
  const { data: minutes, isPending, isError } = useTopicMinutes(topicId)

  let text: string
  if (isPending) text = 'Calculando…'
  else if (isError) text = 'No se pudo calcular'
  else if (minutes === 0) text = 'Aún no has estudiado este tema'
  else text = `${formatDuration(minutes)} estudiados`

  return (
    <p className="text-sm text-fg-muted">
      Tiempo en este tema: <strong className="font-bold text-fg">{text}</strong>
    </p>
  )
}
