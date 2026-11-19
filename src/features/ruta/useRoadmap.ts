import { useQuery } from '@tanstack/react-query'
import { fetchRoadmap } from './roadmapApi'

/** El contenido de la ruta cambia poco (solo al correr el seed): se reutiliza por una hora. */
export function useRoadmap() {
  return useQuery({ queryKey: ['roadmap'], queryFn: fetchRoadmap, staleTime: 60 * 60 * 1000 })
}
