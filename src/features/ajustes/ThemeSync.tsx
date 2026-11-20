import { useEffect, useRef } from 'react'
import { useTheme } from '@/app/ThemeContext'
import { useUserSettings } from './useUserSettings'

/** Aplica el tema guardado en la cuenta (por si lo cambiaste en otro dispositivo). */
export function ThemeSync() {
  const savedTheme = useUserSettings().data?.theme
  const { preference, setPreference } = useTheme()
  const lastApplied = useRef<string | undefined>(undefined)

  useEffect(() => {
    // Solo actúa cuando cambia lo guardado en la cuenta, no con cada cambio local.
    if (!savedTheme || savedTheme === lastApplied.current) return
    lastApplied.current = savedTheme
    if (savedTheme !== preference) setPreference(savedTheme)
  }, [savedTheme, preference, setPreference])

  return null
}
