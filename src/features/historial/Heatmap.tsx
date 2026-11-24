import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { addDaysToKey } from '@/lib/dates'
import { cn } from '@/lib/cn'
import { cellLabel, type HeatWeek } from './heatmapModel'
import { levelClasses } from './heatmapStyles'

const WEEKDAYS = ['Lun', '', 'Mié', '', 'Vie', '', 'Dom']

// Flechas: izquierda/derecha cambian de semana; arriba/abajo, de día.
const KEY_STEPS: Partial<Record<string, number>> = {
  ArrowLeft: -7,
  ArrowRight: 7,
  ArrowUp: -1,
  ArrowDown: 1,
}

// En el móvil, 24 px por cuadro (cómodo para el dedo) y se desplaza de lado;
// desde sm, más pequeño para que quepan los 6 meses.
const cellSize = 'size-6 sm:size-5 xl:size-7'

interface HeatmapProps {
  weeks: readonly HeatWeek[]
  selected: string
  onSelect: (day: string) => void
}

/** Un cuadro por día; columnas = semanas de lunes a domingo. Se abre mostrando lo más reciente. */
export function Heatmap({ weeks, selected, onSelect }: HeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef(new Map<string, HTMLButtonElement>())

  useLayoutEffect(() => {
    const scroller = scrollRef.current
    if (scroller) scroller.scrollLeft = scroller.scrollWidth
  }, [])

  function handleKeyDown(event: KeyboardEvent, day: string) {
    const step = KEY_STEPS[event.key]
    if (step === undefined) return
    event.preventDefault()
    const target = cellRefs.current.get(addDaysToKey(day, step))
    if (!target) return
    onSelect(addDaysToKey(day, step))
    target.focus()
  }

  return (
    // Sin padding lateral en el contenedor: así la columna fija de los días tapa todo lo que
    // pasa por debajo. El pr-1 deja ver el contorno del día elegido en la última columna.
    <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain pt-1 pb-3">
      <div
        role="group"
        aria-label="Minutos por día. Usa las flechas para moverte entre días."
        className="inline-flex gap-1 pr-2"
      >
        <div className="sticky left-0 z-10 flex flex-col gap-1 bg-bg pr-2" aria-hidden>
          <span className="h-5" />
          {WEEKDAYS.map((label, index) => (
            <span key={index} className="flex h-6 items-center text-xs text-fg-muted sm:h-5">
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week.weekStart} className="flex flex-col gap-1">
            <span className="h-5 w-0 text-xs leading-5 whitespace-nowrap text-fg-muted" aria-hidden>
              {week.monthLabel}
            </span>
            {week.cells.map((cell) =>
              cell.future ? (
                <span key={cell.day} className={cellSize} aria-hidden />
              ) : (
                <button
                  key={cell.day}
                  ref={(element) => {
                    if (element) cellRefs.current.set(cell.day, element)
                    else cellRefs.current.delete(cell.day)
                  }}
                  type="button"
                  tabIndex={cell.day === selected ? 0 : -1}
                  aria-label={cellLabel(cell.day, cell.minutes)}
                  aria-pressed={cell.day === selected}
                  title={cellLabel(cell.day, cell.minutes)}
                  onClick={() => onSelect(cell.day)}
                  onKeyDown={(event) => handleKeyDown(event, cell.day)}
                  className={cn(
                    cellSize,
                    'rounded-[5px] transition-transform hover:scale-110',
                    levelClasses[cell.level],
                    cell.day === selected && 'ring-2 ring-fg ring-offset-2 ring-offset-bg',
                  )}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
