import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/SelectField'
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
  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <SelectField
          label="Conversación"
          value={selectedId ?? ''}
          disabled={disabled || conversations.length === 0}
          onChange={(event) => onSelect(event.target.value)}
        >
          {selectedId === null && <option value="">Nueva conversación</option>}
          {conversations.map((conversation) => (
            <option key={conversation.id} value={conversation.id}>
              {formatShortDate(conversation.updatedAt)} · {conversation.title}
            </option>
          ))}
        </SelectField>
      </div>
      <Button
        variant="secondary"
        className="min-h-12"
        disabled={disabled || selectedId === null}
        onClick={onNew}
      >
        <MessageSquarePlus className="size-4" />
        Nueva
      </Button>
    </div>
  )
}
