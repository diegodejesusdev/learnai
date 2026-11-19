import { Bot } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

interface PreviewMessage {
  role: 'user' | 'assistant'
  content: string
}

const sampleMessages: readonly PreviewMessage[] = [
  {
    role: 'assistant',
    content:
      'Hola, Diego. Un webhook es como un timbre: la otra app te avisa cuando pasa algo, en vez de que tú preguntes cada minuto (polling).',
  },
  { role: 'user', content: '¿Y cómo lo pruebo sin tener servidor?' },
  {
    role: 'assistant',
    content:
      'Con webhook.site: te da una URL temporal y ves cada petición que llega, con headers y body.',
  },
]

export function ChatPreview() {
  return (
    <Card className="flex flex-col gap-3" aria-label="Conversación de ejemplo">
      {sampleMessages.map((message, index) => (
        <div key={index} className={cn('flex gap-2', message.role === 'user' && 'justify-end')}>
          {message.role === 'assistant' && (
            <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg">
              <Bot className="size-4" />
            </span>
          )}
          <p
            className={cn(
              'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
              message.role === 'user'
                ? 'rounded-br-md bg-accent text-accent-fg'
                : 'rounded-bl-md bg-surface-muted',
            )}
          >
            {message.content}
          </p>
        </div>
      ))}
    </Card>
  )
}
