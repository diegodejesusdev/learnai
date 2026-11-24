import { useCallback, useSyncExternalStore } from 'react'

/** Desde 1280 px (xl de Tailwind) hay lugar para un panel lateral. */
export const WIDE_SCREEN = '(min-width: 1280px)'

/** Si se cumple una media query; se actualiza sola. Sin matchMedia (tests), no se cumple. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  )
}
