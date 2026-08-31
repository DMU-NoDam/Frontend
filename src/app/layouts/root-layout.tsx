import { Outlet } from 'react-router-dom'
import { TripGenerationWatcher } from '@/features/trip/components/TripGenerationWatcher'
import { AppShell } from './app-shell'

export function RootLayout() {
  return (
    <AppShell>
      <Outlet />
      <TripGenerationWatcher />
    </AppShell>
  )
}
