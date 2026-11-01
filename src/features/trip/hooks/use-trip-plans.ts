import { isCancelledError, useIsMutating, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { planApi } from '../api/plan-api'
import { isPlanEditMeta } from '../lib/plan-edit-meta'
import {
  TRANSPORT_POLL_INTERVAL_MS,
  TRANSPORT_POLL_WINDOW_MS,
  hasPendingTransport,
} from '../lib/plan-transport'
import { tripKeys } from '../query/trip-keys'
import type { DatePlan } from '../types/plan-types'

// 다른 멤버의 편집을 서버가 알려주는 수단이 없어서(WebSocket/SSE 없음), 주기적으로 다시 읽는
// 것이 같이 편집하는 것처럼 보이게 하는 유일한 방법이다. 응답에 경로 polygon까지 들어 있어
// 가볍지 않으니 간격을 더 좁히지는 않는다.
const LIVE_POLL_INTERVAL_MS = 5000

// 편집이 일어나면 그 DatePlan의 version이 오른다. 경로가 채워지는 것만으로는 version이
// 바뀌지 않으므로, 이 값은 "기다리는 중인 작업"을 가리키는 식별자가 된다.
const signatureOf = (datePlans: DatePlan[]) =>
  datePlans.map((d) => `${d.id}:${d.version}`).join(',')

// 아직 채워지지 않은 구간이 있고, 그 작업을 포기하지 않았다면 기다리는 중이다.
const isWaitingForTransport = (
  datePlans: DatePlan[] | undefined,
  pausePolling: boolean,
  abandonedSignature: string | null,
) =>
  !pausePolling &&
  Boolean(datePlans && hasPendingTransport(datePlans)) &&
  abandonedSignature !== (datePlans ? signatureOf(datePlans) : '')

type Options = {
  // 켜면 다른 멤버의 편집을 따라잡기 위해 주기적으로 다시 읽는다. 같이 편집하는 화면(상세)
  // 에서만 켠다 — 혼자 보는 화면에서는 무거운 응답을 주기적으로 받을 이유가 없다.
  live?: boolean
  // 드래그하는 동안 멈춘다. 끌고 있는 도중에 목록이 새로 오면 프레임이 끊긴다.
  // (순서가 되돌아가는 것은 TripScheduleView가 반영을 미뤄서 막는다)
  pausePolling?: boolean
  // 상세 페이지 전용. 넘기면 마운트할 때와 이 값이 바뀔 때마다 캐시 유효 시간과 관계없이
  // 서버에서 다시 읽고, 그 조회가 끝나기 전까지는 캐시에 남은 이전 일정을 내보내지 않는다.
  // 폴링·편집 응답으로 캐시가 바뀌는 것은 이 조회가 아니므로 로딩으로 돌아가지 않는다.
  refreshKey?: number
}

// refreshKey로 시작한 조회의 결과. key가 지금 요청과 같을 때만 유효하다
type FreshResult = { key: string; ok: boolean }

export const useTripPlans = (
  tripId: string | undefined,
  { live, pausePolling, refreshKey }: Options = {},
) => {
  // 창이 닫히도록 안 채워진 작업의 signature. 외부 경로 API가 실패했을 가능성이 크므로
  // 그 작업에 대해서는 더 묻지 않는다. 편집이 새로 일어나면 signature가 달라져 다시 기다린다.
  const [abandonedSignature, setAbandonedSignature] = useState<string | null>(null)
  const [freshResult, setFreshResult] = useState<FreshResult | null>(null)

  // 내 편집이 날아가는 동안에도 멈춘다. 먼저 출발한 조회의 낡은 응답이 편집 응답 뒤에
  // 도착하면 화면이 편집 전 상태로 한 번 되돌아간다.
  const isPlanEditing = useIsMutating({
    predicate: (mutation) => isPlanEditMeta(mutation.options.meta),
  }) > 0
  const paused = Boolean(pausePolling) || isPlanEditing

  const isFreshMode = refreshKey !== undefined
  const freshKey = isFreshMode && tripId ? `${tripId}:${refreshKey}` : null

  const query = useQuery({
    queryKey: tripKeys.plans(tripId ?? ''),
    queryFn: () => planApi.getPlans(tripId!),
    enabled: Boolean(tripId),
    meta: { globalLoading: true },
    // 진입 조회는 아래 effect가 직접 한다. 여기서도 하면 캐시가 있을 때 요청이 두 번 나간다
    ...(isFreshMode && { refetchOnMount: false }),
    // 캐시 상태에서 직접 판단한다 — 아래 isTransportPending을 참조하면 순환이 된다
    refetchInterval: (q) => {
      if (paused) return false
      // 끊긴 이동 구간이 채워지기를 기다리는 중이면 그 간격을 따른다
      if (isWaitingForTransport(q.state.data?.datePlans, paused, abandonedSignature)) {
        return TRANSPORT_POLL_INTERVAL_MS
      }
      return live ? LIVE_POLL_INTERVAL_MS : false
    },
  })

  const { refetch } = query

  useEffect(() => {
    if (!freshKey) return
    let ignore = false

    const fetchLatest = async () => {
      try {
        // 데이터가 있으면 진행 중인 조회(폴링, 직전 Day의 조회)를 취소하고 새로 요청한다.
        // 아직 없으면 방금 시작된 첫 조회를 그대로 기다린다 (react-query가 같은 요청을 재사용).
        await refetch({ cancelRefetch: true, throwOnError: true })
      } catch (error) {
        if (!isCancelledError(error)) throw error
        // 더 늦게 시작한 조회(편집 실패 후 invalidate 등)가 이 요청을 대체했다. 그 결과를 기다린다
        await refetch({ cancelRefetch: false, throwOnError: true })
      }
    }

    // 빠르게 Day를 바꾸면 앞선 조회의 결과는 버린다 — 마지막 요청의 결과만 반영한다
    fetchLatest().then(
      () => { if (!ignore) setFreshResult({ key: freshKey, ok: true }) },
      () => { if (!ignore) setFreshResult({ key: freshKey, ok: false }) },
    )
    return () => { ignore = true }
  }, [freshKey, refetch])

  const isFreshPending = freshKey !== null && freshResult?.key !== freshKey
  const isFreshFailed = freshKey !== null && freshResult?.key === freshKey && !freshResult.ok
  const hideData = isFreshPending || isFreshFailed

  const datePlans = query.data?.datePlans
  const signature = datePlans ? signatureOf(datePlans) : ''
  const isTransportPending = isWaitingForTransport(datePlans, paused, abandonedSignature)

  // 창이 다 지나면 포기한다. 그 전에 구간이 채워지면 isTransportPending이 꺼지면서 타이머도 정리된다.
  useEffect(() => {
    if (!isTransportPending) return

    const timer = setTimeout(() => setAbandonedSignature(signature), TRANSPORT_POLL_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [isTransportPending, signature])

  return {
    ...query,
    data: hideData ? undefined : query.data,
    isLoading: isFreshPending || query.isLoading,
    isError: isFreshFailed || (!isFreshPending && query.isError),
    isTransportPending: !hideData && isTransportPending,
  }
}
