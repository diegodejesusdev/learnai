import { createContext, useContext } from 'react'

export interface AuthUser {
  id: string
  email: string | null
}

export type AuthState =
  { status: 'loading' } | { status: 'signed_out' } | { status: 'signed_in'; user: AuthUser }

export type AuthContextValue = AuthState & {
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return value
}
