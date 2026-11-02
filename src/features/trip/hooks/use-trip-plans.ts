import { isCancelledError, useIsMutating, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { planApi } from '../api/plan-api'
import { isPlanEditMeta } from '../lib/plan-edit-meta'
import { tripKeys } from '../query/trip-keys'
import type { TripThemeType } from '../types/plan-types'
import { usePendingTransportWatch } from './use-pending-transport-watch'
import { usePlanVersionWatch } from './use-plan-version-watch'

// 다른 멤버의 편집은 DatePlan의 version으로 감지한다(usePlanVersionWatch). 전체 조회는
// version으로 알 수 없는 변경 — 새 DatePlan 추가·삭제 — 를 줍는 느린 재동기화만 담당한다.
const LIVE_RESYNC_INTERVAL_MS = 60000

// 앱으로 돌아왔을 때의 재조회를 이 간격 안에 중복 실행하지 않는다 (focus와
// visibilitychange가 거의 동시에 오고, 탭을 빠르게 왕복할 수도 있다)
const RETURN_RESYNC_THROTTLE_MS = 3000

type Options = {
  // 켜면 다른 멤버의 편집을 따라잡기 위해 주기적으로 version을 확인하고, 느린 주기로
  // 전체 일정을 다시 읽는다. 같이 편집하는 화면(상세)에서만 켠다.
  live?: boolean
  // live일 때 지켜볼 테마. 화면에 그리는 테마만 확인하면 요청 수가 날짜 수만큼으로 줄어든다.
  // 생략하면 받아온 모든 DatePlan을 확인한다.
  liveTheme?: TripThemeType
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
  { live, liveTheme, pausePolling, refreshKey }: Options = {},
) => {
  const [freshResult, setFreshResult] = useState<FreshResult | null>(null)

  // 내 편집이 날아가는 동안에도 멈춘다. 먼저 출발한 조회의 낡은 응답이 편집 응답 뒤에
  // 도착하면 화면이 편집 전 상태로 한 번 되돌아간다. (이미 날아간 요청은 편집 mutation의
  // onMutate가 취소한다 — 폴링을 끄는 것만으로는 멈추지 않는다)
  const isPlanEditing = useIsMutating({
    predicate: (mutation) => isPlanEditMeta(mutation.options.meta),
  }) > 0
  const paused = Boolean(pausePolling) || isPlanEditing

  const isFreshMode = refreshKey !== undefined
  const freshKey = isFreshMode && tripId ? `${tripId}:${refreshKey}` : null

  const query = useQuery({
    queryKey: tripKeys.plans(tripId ?? ''),
    queryFn: ({ signal }) => planApi.getPlans(tripId!, signal),
    enabled: Boolean(tripId),
    meta: { globalLoading: true },
    // 진입 조회는 아래 effect가 직접 한다. 여기서도 하면 캐시가 있을 때 요청이 두 번 나간다
    ...(isFreshMode && { refetchOnMount: false }),
    refetchInterval: live && !paused ? LIVE_RESYNC_INTERVAL_MS : false,
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

  // 화면에 그리는 테마만 지켜본다. 상세 페이지는 확정 테마 하나만 보여주는데, 전체 조회는
  // 모든 테마의 DatePlan을 주기 때문에 그냥 두면 확인 요청이 몇 배로 늘어난다.
  const watchedDatePlans = useMemo(
    () => (liveTheme ? datePlans?.filter((datePlan) => datePlan.theme === liveTheme) : datePlans),
    [datePlans, liveTheme],
  )

  // 이미 돌고 있는 조회가 있으면 그것을 기다린다 — 같은 변경으로 요청을 겹쳐 보내지 않는다
  const resync = useCallback(() => {
    void refetch({ cancelRefetch: false })
  }, [refetch])

  usePlanVersionWatch({
    tripId,
    datePlans: watchedDatePlans,
    enabled: Boolean(live) && !paused && !hideData,
    onChanged: resync,
  })

  // 경로 계산 완료는 version을 올리지 않으므로 version 확인으로는 알 수 없다. 비어 있는
  // 구간만 따로 물어본다. (live가 아닌 화면도 이 구간은 채워져야 이동 시간이 맞는다)
  const transport = usePendingTransportWatch({
    tripId,
    datePlans: watchedDatePlans,
    enabled: !paused && !hideData,
  })

  // 다시 시도: 기다리는 창을 새로 열고, 전체 일정도 한 번 다시 읽는다. 서버는 이미 계산을
  // 끝냈는데 반영만 놓쳤을 수 있고(늦게 도착해 버려진 응답 등), 그 경우 전체 조회로 복구된다.
  const { retry: retryTransportWatch } = transport
  const retryTransport = useCallback(() => {
    retryTransportWatch()
    void refetch({ cancelRefetch: false })
  }, [retryTransportWatch, refetch])

  // 앱으로 돌아왔을 때 한 번 다시 읽는다. 배경에 있는 동안은 타이머가 느려지거나 멈춰서
  // version 확인이 돌지 않고, 그 사이의 DatePlan 추가·삭제는 version으로도 알 수 없다.
  // (전역 refetchOnWindowFocus는 꺼져 있어서 여기서 직접 처리한다)
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (!live || !tripId) return

    let lastResyncAt = 0
    const handleReturn = () => {
      if (document.visibilityState !== 'visible') return
      if (pausedRef.current) return

      const now = Date.now()
      if (now - lastResyncAt < RETURN_RESYNC_THROTTLE_MS) return
      lastResyncAt = now

      void refetch({ cancelRefetch: false })
    }

    document.addEventListener('visibilitychange', handleReturn)
    window.addEventListener('focus', handleReturn)
    return () => {
      document.removeEventListener('visibilitychange', handleReturn)
      window.removeEventListener('focus', handleReturn)
    }
  }, [live, tripId, refetch])

  return {
    ...query,
    data: hideData ? undefined : query.data,
    isLoading: isFreshPending || query.isLoading,
    // 배경 재동기화가 실패해도 이미 보여주고 있는 일정을 숨기지 않는다. 보여줄 것이 없을
    // 때(첫 조회 실패)와 Day 전환·재시도가 실패했을 때만 오류 화면으로 간다.
    isError: isFreshFailed || (!isFreshPending && query.isError && query.data === undefined),
    // 계산을 기다리는 중. 창이 지나면 꺼지고 isTransportTimedOut이 켜진다
    isTransportPending: !hideData && transport.isPending && !transport.isTimedOut,
    isTransportTimedOut: !hideData && transport.isTimedOut,
    retryTransport,
  }
}
