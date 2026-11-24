import { useSearchParams } from 'react-router'
import { readSessionFilters, writeSessionFilters, type SessionFilters } from './sessionFilters'

/** Los filtros del Historial viven en la URL: se conservan al volver de editar una sesión. */
export function useSessionFilters(): [SessionFilters, (filters: SessionFilters) => void] {
  const [params, setParams] = useSearchParams()
  const setFilters = (next: SessionFilters) =>
    void setParams(writeSessionFilters(params, next), { replace: true, preventScrollReset: true })
  return [readSessionFilters(params), setFilters]
}
