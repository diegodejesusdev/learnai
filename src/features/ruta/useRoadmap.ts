import { useQuery } from '@tanstack/react-query'
import { fetchRoadmap } from './roadmapApi'

/**
 * Antes era ['roadmap'], con una sola ruta. La copia que guardó esa versión en el dispositivo
 * queda sin usar: se cambia esta clave y no CACHE_VERSION (src/app/persistence.ts), que borraría
 * también los cambios en cola que aún no se han subido.
 */
export const roadmapKey = ['roadmap', 'tracks'] as const

/** El contenido de las rutas cambia poco (solo al correr el seed): se reutiliza por una hora. */
export function useRoadmap() {
  return useQuery({ queryKey: roadmapKey, queryFn: fetchRoadmap, staleTime: 60 * 60 * 1000 })
}
