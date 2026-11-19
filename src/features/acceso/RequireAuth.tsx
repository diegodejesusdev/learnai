import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingState } from '@/components/ui/LoadingState'
import { useAuth } from './AuthContext'

/** Sin sesión solo existe /login: cualquier otra ruta redirige allí. */
export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') return <LoadingState fullScreen />
  if (auth.status === 'signed_out') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
