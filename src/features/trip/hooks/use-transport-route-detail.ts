import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { planApi } from '../api/plan-api'
import { applyRouteInfoToPlans } from '../lib/plan-transport'
import { tripKeys } from '../query/trip-keys'
import type { DatePlan, PlanListResponse } from '../types/plan-types'

type Options = {
  tripId: string | undefined
  datePlans: DatePlan[] | undefined
  // 지금 선택한 이동 구간의 Transport.id. 선택이 없으면 null
  transportId: number | null
}

type Result = {
  // 지도에 그릴 경로를 끝내 얻지 못했다. 반복 요청하지 않고 빈 상태로 알린다
  isRouteUnavailable: boolean
}

// 선택한 이동 구간의 경로가 비어 있을 때만 상세를 조회한다.
//
// 전체 일정 응답과 장소 앞뒤 구간 응답에 이미 routeInfo가 들어 있고(TransportPlanInfo.of),
// 백엔드 TransportPlan은 routeInfo가 필수 컬럼이라 구간이 있으면 경로도 있다. 그래서 평소에는
// 이 조회가 한 번도 나가지 않는다 — 경로가 빠진 구간을 골랐을 때의 보조 경로다.
export function useTransportRouteDetail({ tripId, datePlans, transportId }: Options): Result {
  const queryClient = useQueryClient()

  const selected = useMemo(() => {
    if (transportId === null) return null

    for (const datePlan of datePlans ?? [])
      for (const plan of datePlan.plans)
        if (plan.fromTransport?.id === transportId) return plan.fromTransport

    return null
  }, [datePlans, transportId])

  const transportPlanId =
    selected && selected.routeInfo === null ? selected.transportPlanId ?? null : null

  const { data, isFetched } = useQuery({
    queryKey: tripKeys.transportPlanDetail(tripId ?? '', transportPlanId ?? 0),
    queryFn: ({ signal }) => planApi.getTransportPlanDetail(transportPlanId!, signal),
    enabled: Boolean(tripId) && transportPlanId !== null,
    // 한 번 받으면 같은 구간을 다시 묻지 않는다 — 경로가 없다는 답이어도 마찬가지다
    staleTime: Infinity,
    retry: 0,
  })

  useEffect(() => {
    const routeInfo = data?.routeInfo
    if (!tripId || transportId === null || !routeInfo) return

    // 지금도 그 구간이 캐시에 있고 경로가 비어 있을 때만 넣는다. 화면을 떠난 뒤 도착한
    // 응답이나 이미 삭제된 구간의 응답은 applyRouteInfoToPlans가 그대로 버린다.
    queryClient.setQueryData<PlanListResponse>(tripKeys.plans(tripId), (old) =>
      old ? applyRouteInfoToPlans(old, transportId, routeInfo) : old,
    )
  }, [tripId, transportId, data, queryClient])

  return {
    isRouteUnavailable:
      selected !== null &&
      selected.routeInfo === null &&
      (transportPlanId === null || (isFetched && !data?.routeInfo)),
  }
}
