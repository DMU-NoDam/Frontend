import { useAuthStore } from '@/app/store/auth-store'
import { useHasHydrated } from '@/features/auth/hooks/use-has-hydrated'
import { UserDashboard } from './UserDashboard'
import { GuestDashboard } from './GuestDashboard'

export function DashboardPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useHasHydrated()

  if (!hasHydrated) {
    return null
  }

  return isAuthenticated ? <UserDashboard /> : <GuestDashboard />
}
