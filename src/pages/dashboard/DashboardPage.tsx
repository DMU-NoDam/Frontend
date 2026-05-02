import { useAuthStore } from '@/app/store/auth-store'

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <main className="dashboard-page">
      <section>
        <h1>Dashboard</h1>
        <p>{user?.name ?? 'User'} signed in.</p>
      </section>
    </main>
  )
}
