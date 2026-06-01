import { AppRouter } from '@/app/router/AppRouter'
import { GlobalLoadingOverlay } from '@/shared/components/GlobalLoadingOverlay'
import { QueryProvider } from './query-provider'

export function AppProvider() {
  return (
    <QueryProvider>
      <AppRouter />
      <GlobalLoadingOverlay />
    </QueryProvider>
  )
}
