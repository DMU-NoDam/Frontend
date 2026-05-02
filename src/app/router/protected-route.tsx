import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth-store'

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
