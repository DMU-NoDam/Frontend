import { AppRouter } from '@/app/router/AppRouter'
import { QueryProvider } from './query-provider'

export function AppProvider() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  )
}
