import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { planApi } from '../api/plan-api'
import { getPlanEditErrorKind, shouldRefetchAfter } from '../lib/plan-error'
import { tripKeys } from '../query/trip-keys'
import type {
  AddPlaceRequest,
  ChangePlaceRequest,
  DatePlan,
  MovePlaceRequest,
  PlanListResponse,
  RemovePlaceRequest,
} from '../types/plan-types'

// 편집 응답은 그 DatePlan 전체(version 포함)다. invalidate로 다시 읽지 않고 캐시의 해당
// DatePlan만 갈아끼운다 — 그래야 다음 편집이 실어 보낼 version이 항상 방금 받은 값이 된다.
// (invalidate하면 재조회가 끝나기 전까지 낡은 version이 남는다)
function replaceDatePlan(queryClient: QueryClient, tripId: string, updated: DatePlan) {
  queryClient.setQueryData<PlanListResponse>(tripKeys.plans(tripId), (old) => {
    if (!old) return old
    return {
      ...old,
      datePlans: old.datePlans.map((datePlan) =>
        datePlan.id === updated.id ? updated : datePlan,
      ),
    }
  })
}

// 편집 4종이 성공/실패 후 할 일은 같다. 다른 것은 호출하는 API뿐이라 여기서 한 번만 정의한다.
function usePlanEditMutation<TRequest>(
  tripId: string | undefined,
  mutationFn: (req: TRequest) => Promise<DatePlan>,
  meta?: Record<string, unknown>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    meta,
    onSuccess: (updated: DatePlan) => {
      if (!tripId) return
      replaceDatePlan(queryClient, tripId, updated)
    },
    onError: (error: unknown) => {
      if (!tripId) return
      // 충돌/없음은 재시도해도 같은 결과다. 서버의 최신 일정을 다시 읽어 화면을 맞춘다.
      // (호출부는 getPlanEditErrorMessage로 사용자 안내 문구를 얻는다)
      if (shouldRefetchAfter(getPlanEditErrorKind(error))) {
        void queryClient.invalidateQueries({ queryKey: tripKeys.plans(tripId) })
      }
    },
  })
}

export const useAddPlace = (tripId: string | undefined) =>
  usePlanEditMutation<AddPlaceRequest>(tripId, planApi.addPlace)

// 기존 useReplacePlacePlan을 대체한다. 전체 화면 로딩도 그대로 유지한다.
export const useChangePlace = (tripId: string | undefined) =>
  usePlanEditMutation<ChangePlaceRequest>(tripId, planApi.changePlace, { globalLoading: true })

// 드래그로 순서를 바꾸는 경로다. 전체 화면 로딩을 걸면 드래그 감각이 끊기므로 meta를 두지 않는다.
export const useMovePlace = (tripId: string | undefined) =>
  usePlanEditMutation<MovePlaceRequest>(tripId, planApi.movePlace)

export const useRemovePlace = (tripId: string | undefined) =>
  usePlanEditMutation<RemovePlaceRequest>(tripId, planApi.removePlace)
