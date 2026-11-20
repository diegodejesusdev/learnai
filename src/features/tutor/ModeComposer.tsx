import { Sparkles, Square } from 'lucide-react'
import { useId, useState } from 'react'
import type { TutorMode } from '@shared/tutorTypes'
import { Button } from '@/components/ui/Button'
import { fieldControlClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import { ChatComposer } from './ChatComposer'

interface ModeComposerProps {
  mode: TutorMode
  /** «Webhooks» o el título del proyecto. */
  subject: string
  sending: boolean
  onSend: (text: string) => Promise<boolean>
  onStop: () => void
}

const TIME_OPTIONS = ['30 minutos', '45 minutos', '1 hora', '2 horas'] as const

function QuizComposer({ sending, onSend, onStop }: Omit<ModeComposerProps, 'mode' | 'subject'>) {
  const [focus, setFocus] = useState('')
  const id = useId()
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const topicFocus = focus.trim()
        setFocus('')
        void onSend(
          topicFocus
            ? `Quiz de 5 preguntas sobre el tema, con énfasis en: ${topicFocus}`
            : 'Quiz de 5 preguntas sobre el tema.',
        )
      }}
    >
      <label htmlFor={id} className="sr-only">
        Enfoque del quiz (opcional)
      </label>
      <input
        id={id}
        value={focus}
        onChange={(event) => setFocus(event.target.value)}
        placeholder="Enfoque opcional: firmas, errores…"
        className={cn(fieldControlClasses, 'min-h-11 min-w-0 flex-1')}
      />
      {sending ? (
        <Button type="button" variant="secondary" onClick={onStop}>
          <Square className="size-4 fill-current" />
          Detener
        </Button>
      ) : (
        <Button type="submit">
          <Sparkles className="size-4" />
          Nuevo quiz
        </Button>
      )}
    </form>
  )
}

/** La caja de abajo, según el modo: chat, quiz o plan con atajos de tiempo. */
export function ModeComposer({ mode, subject, sending, onSend, onStop }: ModeComposerProps) {
  if (mode === 'quiz') return <QuizComposer sending={sending} onSend={onSend} onStop={onStop} />
  const placeholder = {
    explain: `Pregunta sobre «${subject}»…`,
    project_review: 'Pega tu solución, el JSON del flujo o el README…',
    daily_plan: '¿Cuánto tiempo tienes hoy?',
  }[mode]
  return (
    <div className="flex flex-col gap-2">
      {mode === 'daily_plan' && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Tiempo disponible"
        >
          {TIME_OPTIONS.map((time) => (
            <Button
              key={time}
              variant="secondary"
              disabled={sending}
              className="shrink-0"
              onClick={() => void onSend(`Tengo ${time} para estudiar hoy. ¿Qué hago?`)}
            >
              {time}
            </Button>
          ))}
        </div>
      )}
      <ChatComposer placeholder={placeholder} sending={sending} onSend={onSend} onStop={onStop} />
    </div>
  )
}
