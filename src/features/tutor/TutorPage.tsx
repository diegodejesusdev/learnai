import { Send } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { DemoNotice } from '@/components/ui/DemoNotice'
import { PageHeader } from '@/components/ui/PageHeader'
import { SelectField } from '@/components/ui/SelectField'
import { allTopics, findPhase, findTopic, phaseLabel, phases } from '@/data/curriculum'
import { demoStats } from '@/data/demo'
import { ChatPreview } from './ChatPreview'
import { ModePicker } from './ModePicker'
import type { TutorMode } from './tutorModes'

export function TutorPage() {
  const [params] = useSearchParams()
  const projectParam = findPhase(params.get('proyecto') ?? undefined)
  const [mode, setMode] = useState<TutorMode>(projectParam ? 'project_review' : 'explain')
  const [topicId, setTopicId] = useState(
    () => findTopic(params.get('tema') ?? undefined)?.topic.id ?? demoStats.lastTopicId,
  )
  const [phaseId, setPhaseId] = useState(() => projectParam?.id ?? 'f0')

  return (
    <>
      <PageHeader title="Tutor" description="Tu tutor conoce la ruta y tu progreso." />
      <DemoNotice>Conversación de ejemplo. El tutor con IA se conecta en la fase 6.</DemoNotice>
      <div className="flex flex-col gap-4">
        <ModePicker value={mode} onChange={setMode} />
        {(mode === 'explain' || mode === 'quiz') && (
          <SelectField
            label="Tema"
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
          >
            {allTopics.map(({ topic, phase }) => (
              <option key={topic.id} value={topic.id}>
                {phaseLabel(phase)} · {topic.title}
              </option>
            ))}
          </SelectField>
        )}
        {mode === 'project_review' && (
          <SelectField
            label="Proyecto"
            value={phaseId}
            onChange={(event) => setPhaseId(event.target.value)}
          >
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phaseLabel(phase)} · {phase.project.title}
              </option>
            ))}
          </SelectField>
        )}
        <ChatPreview />
        <form className="flex items-end gap-2" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="tutor-message" className="sr-only">
            Mensaje para el tutor
          </label>
          <textarea
            id="tutor-message"
            rows={1}
            disabled
            placeholder="Escribe tu pregunta…"
            className="min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-base placeholder:text-fg-muted/70 disabled:opacity-60"
          />
          <Button type="submit" size="icon" disabled aria-label="Enviar">
            <Send className="size-5" />
          </Button>
        </form>
      </div>
    </>
  )
}
