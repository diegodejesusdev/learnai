// Escalas y estilos compartidos por las gráficas del Historial (Recharts).

/** Texto de los ejes: tokens del tema, nunca el color de los datos. */
export const axisTick = { fill: 'var(--fg-muted)', fontSize: 11 }

/** Marcas del eje de minutos en horas enteras y redondas (0, 2, 4… h) que cubren `maxMinutes`. */
export function hourTicks(maxMinutes: number): number[] {
  const hours = Math.max(1, Math.ceil(maxMinutes / 60))
  const step = hours <= 4 ? 1 : hours <= 10 ? 2 : hours <= 25 ? 5 : 10
  const top = Math.ceil(hours / step) * step
  return Array.from({ length: top / step + 1 }, (_, index) => index * step * 60)
}
