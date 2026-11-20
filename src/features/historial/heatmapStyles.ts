import type { HeatLevel } from './heatmapModel'

/** Color de cada nivel (tokens heat-* de index.css, con su versión para el tema oscuro). */
export const levelClasses: Record<HeatLevel, string> = {
  0: 'bg-heat-0',
  1: 'bg-heat-1',
  2: 'bg-heat-2',
  3: 'bg-heat-3',
  4: 'bg-heat-4',
}
