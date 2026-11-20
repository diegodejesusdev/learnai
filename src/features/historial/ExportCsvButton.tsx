import { useMutation } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { downloadTextFile } from '@/lib/download'
import { toast } from '@/lib/toast'
import type { Phase } from '@/types/curriculum'
import { sessionsCsv } from './sessionCsv'
import { fetchAllSessions } from './sessionsApi'
import { todayKey } from './useStudyStats'

/** Descarga todas las sesiones (sin filtros) en un CSV para Google Sheets, Excel o pandas. */
export function ExportCsvButton({ phases }: { phases: readonly Phase[] }) {
  const exportCsv = useMutation({
    mutationFn: fetchAllSessions,
    onSuccess: (sessions) => {
      if (sessions.length === 0) {
        toast.error('Aún no tienes sesiones para exportar.')
        return
      }
      downloadTextFile(
        `learnai-sesiones-${todayKey()}.csv`,
        sessionsCsv(sessions, phases),
        'text/csv;charset=utf-8',
      )
      toast.success(
        sessions.length === 1 ? 'Exportaste 1 sesión.' : `Exportaste ${sessions.length} sesiones.`,
      )
    },
    onError: () => toast.error('No se pudo exportar. Revisa tu conexión e inténtalo de nuevo.'),
  })

  return (
    <Button
      variant="secondary"
      disabled={exportCsv.isPending}
      onClick={() => exportCsv.mutate()}
      aria-label="Exportar todas las sesiones a CSV"
    >
      {exportCsv.isPending ? <Spinner /> : <Download className="size-4" />}
      CSV
    </Button>
  )
}
