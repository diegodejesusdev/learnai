import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  applyTheme,
  getSystemPrefersDark,
  readStoredPreference,
  resolveTheme,
  storePreference,
  subscribeToSystemTheme,
  type ThemePreference,
} from '@/lib/theme'
import { ThemeContext, type ThemeContextValue } from './ThemeContext'

// Por ahora la preferencia vive en este dispositivo; en la fase 2 se sincroniza en user_settings.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)
  const systemPrefersDark = useSyncExternalStore(subscribeToSystemTheme, getSystemPrefersDark)
  const resolved = resolveTheme(preference, systemPrefersDark)

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved,
      setPreference: (next) => {
        storePreference(next)
        setPreferenceState(next)
      },
    }),
    [preference, resolved],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
