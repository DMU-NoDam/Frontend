import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth-store'
import { useHasHydrated } from '@/features/auth/hooks/use-has-hydrated'

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useHasHydrated()

  if (!hasHydrated) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
