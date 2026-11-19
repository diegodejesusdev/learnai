import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthContextValue, type AuthState } from './AuthContext'
import { signOut } from './authApi'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    // Emite INITIAL_SESSION al arrancar (incluido el token que trae el enlace mágico en la URL)
    // y luego cada inicio o cierre de sesión, también desde otras pestañas.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') queryClient.clear()
      setState(
        session
          ? {
              status: 'signed_in',
              user: { id: session.user.id, email: session.user.email ?? null },
            }
          : { status: 'signed_out' },
      )
    })
    return () => data.subscription.unsubscribe()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(() => ({ ...state, signOut }), [state])
  return <AuthContext value={value}>{children}</AuthContext>
}
