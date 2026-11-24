import { useMutation } from '@tanstack/react-query'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/acceso/AuthContext'
import { toDayKey } from '@/lib/dates'
import { downloadTextFile } from '@/lib/download'
import { useOnline } from '@/lib/offline'
import { toast } from '@/lib/toast'
import { fetchExportRows } from './exportApi'
import { buildExport, exportFileName } from './exportData'

/** Descarga todos tus datos en un JSON: sesiones, notas, progreso y conversaciones. */
export function ExportDataSection() {
  const auth = useAuth()
  const online = useOnline()
  const email = auth.status === 'signed_in' ? (auth.user.email ?? '') : ''

  const exportData = useMutation({
    networkMode: 'always',
    mutationFn: fetchExportRows,
    onSuccess: (rows) => {
      const now = new Date()
      const data = buildExport(rows, { email, now })
      downloadTextFile(
        exportFileName(toDayKey(now)),
        JSON.stringify(data, null, 2),
        'application/json;charset=utf-8',
      )
      toast.success(
        `Descargaste tus datos: ${data.resumen.sesiones} sesiones y ${data.resumen.conversaciones_con_el_tutor} conversaciones.`,
      )
    },
    onError: () =>
      toast.error('No se pudieron exportar tus datos. Revisa tu conexión e inténtalo de nuevo.'),
  })

  return (
    <Section
      split
      title="Mis datos"
      description="Una copia de todo lo tuyo en LearnAI: sesiones, notas, progreso, ajustes y conversaciones con el tutor."
    >
      <div className="flex flex-col gap-3">
        <Button
          variant="secondary"
          className="self-start"
          disabled={!online || exportData.isPending}
          onClick={() => exportData.mutate()}
        >
          {exportData.isPending ? <Spinner /> : <FileDown className="size-4" />}
          Exportar mis datos (JSON)
        </Button>
        {!online && <p className="text-sm text-fg-muted">Necesitas conexión para exportar.</p>}
      </div>
    </Section>
  )
}
