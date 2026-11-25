import { useEffect, useState } from 'react'

/** Cuánto por debajo del borde de arriba cuenta como «lo que estás leyendo». */
const READING_LINE_PX = 160

/** El id del último título que ya pasó por la línea de lectura. */
export function useActiveHeading(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState<string>()

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const passed = ids.filter((id) => {
        const top = document.getElementById(id)?.getBoundingClientRect().top
        return top !== undefined && top <= READING_LINE_PX
      })
      setActive(passed.at(-1) ?? ids[0])
    }
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [ids])

  return active
}
