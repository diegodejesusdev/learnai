import { NotebookPen } from 'lucide-react'
import { useRef, useState, type RefObject } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { TextAreaField } from '@/components/ui/TextAreaField'
import { formatShortDate } from '@/lib/dates'
import { toast } from '@/lib/toast'
import { useAppendNotes } from './useTutor'

export interface NotesTarget {
  target: { topicId: string } | { phaseId: string }
  /** «Webhooks» o «Proyecto: …», para el aviso. */
  label: string
}

interface SaveToNotesProps extends NotesTarget {
  text: string
  /** La burbuja de la respuesta: si seleccionaste un trozo dentro, se propone ese trozo. */
  messageRef: RefObject<HTMLElement | null>
}

function selectionInside(container: HTMLElement | null): string {
  const selection = window.getSelection()
  if (!container || !selection || selection.isCollapsed) return ''
  return container.contains(selection.anchorNode) ? selection.toString().trim() : ''
}

/** «Guardar en notas»: propone la selección (o la respuesta entera) para recortarla y guardarla. */
export function SaveToNotes({ text, messageRef, target, label }: SaveToNotesProps) {
  const [draft, setDraft] = useState<string | null>(null)
  // En el móvil, tocar el botón borra la selección: se lee antes, al apoyar el dedo.
  const selectionRef = useRef('')
  const append = useAppendNotes()

  if (draft === null) {
    return (
      <Button
        variant="ghost"
        className="-ml-4 self-start"
        onPointerDown={() => (selectionRef.current = selectionInside(messageRef.current))}
        onClick={() =>
          setDraft(selectionRef.current || selectionInside(messageRef.current) || text)
        }
      >
        <NotebookPen className="size-4" />
        Guardar en notas
      </Button>
    )
  }

  const save = () =>
    append.mutate(
      { target, text: `Del tutor (${formatShortDate(new Date())}):\n${draft.trim()}` },
      {
        onSuccess: () => {
          toast.success(`Guardado en tus notas de «${label}».`)
          setDraft(null)
        },
      },
    )

  return (
    <div className="flex flex-col gap-4 border border-control bg-surface p-4">
      <TextAreaField
        label={`Fragmento para tus notas de «${label}»`}
        hint="Recórtalo a lo que quieras guardar. Se agrega al final de tus notas."
        rows={6}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      {append.isError && (
        <Alert>No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.</Alert>
      )}
      <div className="flex gap-2">
        <Button disabled={append.isPending || draft.trim() === ''} onClick={save}>
          {append.isPending && <Spinner />}
          Guardar en notas
        </Button>
        <Button variant="secondary" onClick={() => setDraft(null)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
