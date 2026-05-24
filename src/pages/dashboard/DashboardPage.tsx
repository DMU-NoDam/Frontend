import { useAuthStore } from '@/app/store/auth-store'
import { UserDashboard } from './UserDashboard'
import { GuestDashboard } from './GuestDashboard'

export function DashboardPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <UserDashboard /> : <GuestDashboard />
}
