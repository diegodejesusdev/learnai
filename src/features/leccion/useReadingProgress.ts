import { useEffect, useRef, type RefObject } from 'react'
import type { LessonProgress } from './lessonApi'
import { mergeProgress, nextProgress, readingPercent } from './lessonModel'

/**
 * Sigue hasta dónde vas bajando en la lección y avisa cuando hay algo que guardar: cada 10 % y al
 * llegar al final. Abrirla no cuenta; solo lo que bajas (o si cabe entera en la pantalla).
 */
export function useReadingProgress(
  lessonRef: RefObject<HTMLElement | null>,
  saved: LessonProgress,
  onProgress: (progress: LessonProgress) => void,
) {
  // Lo último conocido, para no avisar dos veces lo mismo mientras se guarda.
  const known = useRef(saved)
  const notify = useRef(onProgress)
  useEffect(() => {
    known.current = mergeProgress(known.current, saved)
    notify.current = onProgress
  })

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const box = lessonRef.current?.getBoundingClientRect()
      if (!box) return
      const percent = readingPercent(box, window.innerHeight)
      const next = nextProgress(known.current, percent, new Date().toISOString())
      if (!next) return
      known.current = mergeProgress(known.current, next)
      notify.current(next)
    }
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure)
    }
    const box = lessonRef.current?.getBoundingClientRect()
    if (box && readingPercent(box, window.innerHeight) === 100) onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [lessonRef])
}
