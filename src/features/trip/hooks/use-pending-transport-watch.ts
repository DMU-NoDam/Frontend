import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { planApi } from '../api/plan-api'
import {
  TRANSPORT_POLL_INTERVAL_MS,
  TRANSPORT_POLL_WINDOW_MS,
  TRANSPORT_WATCH_LIMIT,
  applyTransportToPlans,
  findPendingTransportLegs,
  pendingLegsSignature,
} from '../lib/plan-transport'
import { tripKeys } from '../query/trip-keys'
import type { DatePlan, PlanListResponse } from '../types/plan-types'

type Options = {
  tripId: string | undefined
  datePlans: DatePlan[] | undefined
  enabled: boolean
}

type Result = {
  // 아직 채워지지 않은 구간이 있다
  isPending: boolean
  // 창이 다 지나 더 묻지 않는 상태. 사용자가 다시 시도할 수 있다
  isTimedOut: boolean
  retry: () => void
}

// 비어 있는 이동 구간만 그 구간의 출발 장소 기준으로 다시 물어본다.
//
// 경로가 채워져도 DatePlan의 version은 오르지 않으므로 version 확인으로는 완료를 알 수 없다.
// 전체 일정을 다시 읽는 대신 기다리는 구간만 조회하고, 응답은 캐시의 그 자리에만 끼워 넣는다.
export function usePendingTransportWatch({ tripId, datePlans, enabled }: Options): Result {
  const queryClient = useQueryClient()

  const legs = useMemo(
    () => findPendingTransportLegs(datePlans ?? []).slice(0, TRANSPORT_WATCH_LIMIT),
    [datePlans],
  )
  const legsKey = useMemo(() => pendingLegsSignature(legs), [legs])

  const [retrySeq, setRetrySeq] = useState(0)
  const waitKey = `${retrySeq}|${legsKey}`

  const isPending = legs.length > 0

  // 기다리는 창. 편집으로 대기 대상이 달라지면(waitKey 변경) 새로 센다.
  //
  // 드래그나 편집으로 폴링을 잠깐 멈추는 것은 waitKey를 바꾸지 않으므로 이 타이머도
  // 그대로 간다 — 멈췄다 켜기를 반복해 창을 무한히 늘릴 수 없다.
  const [timedOutKey, setTimedOutKey] = useState<string | null>(null)
  useEffect(() => {
    if (!isPending) return

    const timer = setTimeout(() => setTimedOutKey(waitKey), TRANSPORT_POLL_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [isPending, waitKey])

  const isTimedOut = isPending && timedOutKey === waitKey
  const active = enabled && Boolean(tripId) && isPending && !isTimedOut

  const results = useQueries({
    queries: legs.map((leg) => ({
      // version을 key에 넣는다 — 편집이 일어나면 이전 세대의 응답은 다른 query의 것이 되어
      // 지금 화면에 반영되지 않는다 (반영 직전에 version을 한 번 더 확인한다)
      queryKey: tripKeys.placePlanTransport(
        tripId ?? '',
        leg.datePlanId,
        leg.datePlanVersion,
        leg.fromPlacePlanId,
      ),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        planApi.getPlacePlanTransport(leg.datePlanId, leg.fromPlacePlanId, signal),
      enabled: active,
      refetchInterval: active ? TRANSPORT_POLL_INTERVAL_MS : false,
      staleTime: 0,
      gcTime: 0,
      // 배경 조회다. 실패하면 다음 주기에 다시 묻는다 (삭제된 장소는 404가 되고,
      // 그 장소는 다음 전체 조회에서 목록에서 사라지며 대기 대상에서도 빠진다)
      retry: 0,
    })),
  })

  // 이미 반영한 응답을 다시 쓰지 않기 위한 기록. 대기 대상이 바뀌면 비운다
  const appliedAtRef = useRef(new Map<string, number>())
  useEffect(() => {
    appliedAtRef.current = new Map()
  }, [legsKey])

  useEffect(() => {
    if (!tripId) return

    results.forEach((result, index) => {
      const leg = legs[index]
      if (!leg || !result.data || result.dataUpdatedAt === 0) return

      const appliedKey = `${leg.datePlanId}:${leg.datePlanVersion}:${leg.fromPlacePlanId}`
      if (appliedAtRef.current.get(appliedKey) === result.dataUpdatedAt) return
      appliedAtRef.current.set(appliedKey, result.dataUpdatedAt)

      // previous / next 모두 쓴다. 어느 쪽이든 "그 구간의 출발 장소"의 fromTransport로
      // 들어가므로(applyTransportToPlans), 앞 구간이 기준 장소에 잘못 붙지 않는다.
      // 첫 장소의 previous와 마지막 장소의 next가 null인 것은 정상이라 그냥 건너뛴다.
      for (const transport of [result.data.previousTransport, result.data.nextTransport]) {
        if (!transport) continue

        queryClient.setQueryData<PlanListResponse>(tripKeys.plans(tripId), (old) =>
          old ? applyTransportToPlans(old, leg, transport) : old,
        )
      }
    })
  }, [tripId, legs, results, queryClient])

  const retry = useCallback(() => {
    setTimedOutKey(null)
    setRetrySeq((seq) => seq + 1)
  }, [])

  return { isPending, isTimedOut, retry }
}
