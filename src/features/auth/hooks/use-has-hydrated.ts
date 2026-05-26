import { useSyncExternalStore } from 'react'
import { useAuthStore } from '@/app/store/auth-store'

export function useHasHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => useAuthStore.persist.onFinishHydration(onStoreChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  )
}
