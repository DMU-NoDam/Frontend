import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type TripCreationStatus = 'pending' | 'done' | 'failed' | 'timeout'

type TripCreationState = {
  tripId: string | null
  startedAt: number | null
  // 같은 tripId로 파이프라인을 몇 번째 돌리는지. watcher가 재개 대상을 구분하는 값이라
  // retry()로 올려야 이미 끝난 체인을 새로 시작한다 (tripId만으로는 같은 실행으로 본다).
  attempt: number
  status: TripCreationStatus
  isError: boolean
  start: (tripId: string) => void
  retry: () => void
  clear: () => void
  setStatus: (status: TripCreationStatus, isError: boolean) => void
}

// Persisted so the background pipeline watcher (mounted once at the app root, see
// TripGenerationWatcher) can resume driving an in-progress trip creation across page
// navigation or a reload — the backend advances the pipeline only when the client
// explicitly calls the next step, so nothing lives if this state is lost.
// 새로고침이면 실행 중이던 단계 체인 자체가 사라지므로, watcher는 여기 남은 tripId로
// status를 한 번 조회해 진행 지점을 복구한 뒤 남은 단계를 이어서 호출한다.
export const useTripCreationStore = create<TripCreationState>()(
  persist(
    (set) => ({
      tripId: null,
      startedAt: null,
      attempt: 0,
      status: 'pending',
      isError: false,

      start: (tripId) =>
        set({ tripId, startedAt: Date.now(), attempt: 0, status: 'pending', isError: false }),

      // 이미 만들어진 trip의 파이프라인만 다시 돌린다. trip을 새로 만들지 않으므로
      // 서버에서 이미 끝난 단계는 재개 시 status 1회 조회로 확인되어 건너뛴다.
      // startedAt도 갱신해 생성 타임아웃을 새 시도 기준으로 다시 잰다.
      retry: () =>
        set((s) =>
          s.tripId === null
            ? s
            : { startedAt: Date.now(), attempt: s.attempt + 1, status: 'pending', isError: false },
        ),

      clear: () =>
        set({ tripId: null, startedAt: null, attempt: 0, status: 'pending', isError: false }),
      setStatus: (status, isError) => set({ status, isError }),
    }),
    {
      name: 'arubi-trip-creation',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
