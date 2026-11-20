import { SendHorizontal, Square } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { fieldControlClasses } from '@/components/ui/styles'
import { cn } from '@/lib/cn'

interface ChatComposerProps {
  placeholder: string
  sending: boolean
  /** Devuelve false si falló: el texto vuelve a la caja. */
  onSend: (text: string) => Promise<boolean>
  onStop: () => void
}

const MAX_HEIGHT = 160

/** Caja de mensaje: crece con el texto. En el PC, Enter envía y Shift+Enter hace salto de línea. */
export function ChatComposer({ placeholder, sending, onSend, onStop }: ChatComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const id = useId()

  function resize() {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`
  }

  async function submit() {
    const message = text.trim()
    if (!message || sending) return
    setText('')
    requestAnimationFrame(resize)
    if (!(await onSend(message))) {
      setText(message)
      requestAnimationFrame(resize)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // En el móvil (pantalla táctil) Enter es salto de línea: se envía con el botón.
    const touch =
      typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
    if (event.key === 'Enter' && !event.shiftKey && !touch) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <label htmlFor={id} className="sr-only">
        Mensaje para el tutor
      </label>
      <textarea
        id={id}
        ref={textareaRef}
        rows={1}
        value={text}
        placeholder={placeholder}
        onChange={(event) => {
          setText(event.target.value)
          resize()
        }}
        onKeyDown={onKeyDown}
        className={cn(fieldControlClasses, 'min-h-11 flex-1 resize-none py-2.5')}
      />
      {sending ? (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={onStop}
          aria-label="Detener respuesta"
        >
          <Square className="size-4 fill-current" />
        </Button>
      ) : (
        <Button type="submit" size="icon" disabled={text.trim() === ''} aria-label="Enviar">
          <SendHorizontal className="size-5" />
        </Button>
      )}
    </form>
  )
}
