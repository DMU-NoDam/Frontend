import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type TripCreationStatus = 'pending' | 'done' | 'failed' | 'timeout'

type TripCreationState = {
  tripId: string | null
  startedAt: number | null
  status: TripCreationStatus
  isError: boolean
  start: (tripId: string) => void
  clear: () => void
  setStatus: (status: TripCreationStatus, isError: boolean) => void
}

// Persisted so the background pipeline watcher (mounted once at the app root, see
// TripGenerationWatcher) can resume driving an in-progress trip creation across page
// navigation or a reload — the backend now advances the pipeline only when the client
// explicitly calls the next step, so nothing lives if this state is lost.
export const useTripCreationStore = create<TripCreationState>()(
  persist(
    (set) => ({
      tripId: null,
      startedAt: null,
      status: 'pending',
      isError: false,

      start: (tripId) => set({ tripId, startedAt: Date.now(), status: 'pending', isError: false }),
      clear: () => set({ tripId: null, startedAt: null, status: 'pending', isError: false }),
      setStatus: (status, isError) => set({ status, isError }),
    }),
    {
      name: 'arubi-trip-creation',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
