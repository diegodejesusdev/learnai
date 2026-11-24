import { useState } from 'react'
import { SaveIndicator } from '@/components/ui/SaveIndicator'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { saveStatus } from '@/lib/saveStatus'
import { useDebouncedSave } from '@/lib/useDebouncedSave'
import { useSaveTopicNotes } from './useProgress'

interface TopicNotesProps {
  topicId: string
  initialNotes: string
}

/**
 * Notas con autoguardado. El texto vive en el estado local: si un guardado falla,
 * lo que escribiste no se pierde y puedes reintentar.
 */
export function TopicNotes({ topicId, initialNotes }: TopicNotesProps) {
  const [notes, setNotes] = useState(initialNotes)
  const saveNotes = useSaveTopicNotes()
  const autosave = useDebouncedSave((value: string) => saveNotes.mutate({ topicId, notes: value }))

  return (
    <div className="flex flex-col gap-3 border-t-2 border-fg pt-5">
      <TextAreaField
        label="Mis notas"
        large
        rows={10}
        placeholder="Ideas clave, enlaces, dudas para el tutor…"
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value)
          autosave.schedule(event.target.value)
        }}
        onBlur={autosave.flush}
      />
      <SaveIndicator
        status={saveStatus({ isWaiting: autosave.isWaiting, ...saveNotes })}
        onRetry={() => saveNotes.mutate({ topicId, notes })}
      />
    </div>
  )
}
