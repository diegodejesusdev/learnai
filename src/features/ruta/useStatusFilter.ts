import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { parseStatusFilter, type StatusFilter } from '@/lib/progress'

/** El filtro vive en la URL (?estado=en_curso): se conserva al volver atrás o al recargar. */
export function useStatusFilter(): [StatusFilter, (filter: StatusFilter) => void] {
  const [params, setParams] = useSearchParams()
  const filter = parseStatusFilter(params.get('estado'))

  const setFilter = useCallback(
    (next: StatusFilter) => {
      setParams(
        (previous) => {
          const updated = new URLSearchParams(previous)
          if (next === 'todos') updated.delete('estado')
          else updated.set('estado', next)
          return updated
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return [filter, setFilter]
}
