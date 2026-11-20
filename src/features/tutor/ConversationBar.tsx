import { MessageSquarePlus } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/Button'
import { fieldControlClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'
import { formatShortDate } from '@/lib/dates'
import type { TutorConversation } from './tutorApi'

interface ConversationBarProps {
  conversations: readonly TutorConversation[]
  /** null = conversación nueva (aún sin guardar). */
  selectedId: string | null
  disabled: boolean
  onSelect: (id: string) => void
  onNew: () => void
}

/** Historial de conversaciones de este tema y modo, y el botón de conversación nueva. */
export function ConversationBar({
  conversations,
  selectedId,
  disabled,
  onSelect,
  onNew,
}: ConversationBarProps) {
  const id = useId()
  return (
    <div className="flex items-end gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          Conversación
        </label>
        <select
          id={id}
          value={selectedId ?? ''}
          disabled={disabled || conversations.length === 0}
          onChange={(event) => onSelect(event.target.value)}
          className={cn(fieldControlClasses, 'min-h-11 truncate')}
        >
          {selectedId === null && <option value="">Nueva conversación</option>}
          {conversations.map((conversation) => (
            <option key={conversation.id} value={conversation.id}>
              {formatShortDate(conversation.updatedAt)} · {conversation.title}
            </option>
          ))}
        </select>
      </div>
      <Button variant="secondary" disabled={disabled || selectedId === null} onClick={onNew}>
        <MessageSquarePlus className="size-4" />
        Nueva
      </Button>
    </div>
  )
}
