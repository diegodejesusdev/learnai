import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { formatShortDate } from '@/lib/dates'
import type { ConversationBarProps } from './ConversationBar'

/** En el PC, las conversaciones de este tema y modo a la vista (en el móvil, ConversationBar). */
export function ConversationList({
  conversations,
  selectedId,
  disabled,
  onSelect,
  onNew,
}: ConversationBarProps) {
  return (
    <section className="flex flex-col gap-3 border-t-2 border-fg pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title">Conversaciones</h2>
        <Button variant="secondary" disabled={disabled || selectedId === null} onClick={onNew}>
          <MessageSquarePlus className="size-4" />
          Nueva
        </Button>
      </div>
      {conversations.length === 0 ? (
        <p className="text-sm text-fg-muted">Aún no hay ninguna. La primera empieza al escribir.</p>
      ) : (
        <ul
          aria-label="Conversaciones"
          className="flex max-h-64 flex-col gap-0.5 overflow-y-auto overscroll-contain"
        >
          {conversations.map((conversation) => {
            const selected = conversation.id === selectedId
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-current={selected || undefined}
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    'flex min-h-11 w-full flex-col items-start rounded-control px-3 py-2 text-left transition-colors focus-visible:-outline-offset-2',
                    selected ? 'bg-surface-muted' : 'hover:bg-surface-muted',
                  )}
                >
                  <span className={cn('line-clamp-2 text-sm', selected && 'font-bold')}>
                    {conversation.title}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {formatShortDate(conversation.updatedAt)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
