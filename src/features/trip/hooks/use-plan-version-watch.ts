import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { planApi } from '../api/plan-api'
import { tripKeys } from '../query/trip-keys'
import type { DatePlan } from '../types/plan-types'

// 다른 멤버의 편집을 서버가 알려주는 수단이 없어서(WebSocket/SSE 없음) 주기적으로 확인한다.
// 확인만 하는 조회라 응답이 숫자 하나뿐이고, 전체 일정(경로 polygon 포함)을 매번 받아오던
// 이전 방식보다 훨씬 가볍다.
export const VERSION_POLL_INTERVAL_MS = 5000

// 날짜 수만큼 요청이 늘어나므로 한 주기에 동시에 날아가는 요청 수를 제한한다
const VERSION_REQUEST_CONCURRENCY = 4

// DatePlan 하나당 한 번씩 version을 읽는다.
//
// 한 건이 실패해도 나머지는 그대로 비교한다 — 실패한 DatePlan은 결과에서 빠지고,
// 빠진 것은 "모름"으로 취급해 변경으로 보지 않는다 (배경 조회 실패가 화면을 건드리지 않게).
async function fetchDatePlanVersions(
  datePlanIds: number[],
  signal?: AbortSignal,
): Promise<Record<number, number>> {
  const versions: Record<number, number> = {}
  let cursor = 0

  const worker = async () => {
    while (cursor < datePlanIds.length) {
      const datePlanId = datePlanIds[cursor]
      cursor += 1

      try {
        versions[datePlanId] = await planApi.getDatePlanVersion(datePlanId, signal)
      } catch (error) {
        // 취소는 이 확인 자체가 버려진 것이므로 그대로 올려 결과를 쓰지 않게 한다
        if (signal?.aborted) throw error
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(VERSION_REQUEST_CONCURRENCY, datePlanIds.length) }, worker),
  )

  return versions
}

type Options = {
  tripId: string | undefined
  // 지켜볼 DatePlan들. 지금 캐시에 들고 있는 version이 비교 기준이다
  datePlans: DatePlan[] | undefined
  enabled: boolean
  // 서버 version이 캐시와 달라졌을 때 한 번 호출된다. 전체 일정을 다시 읽는 쪽이 구현한다.
  // 여러 DatePlan이 한꺼번에 바뀌어도 한 응답에 대해 한 번만 호출한다.
  onChanged: () => void
}

export function usePlanVersionWatch({ tripId, datePlans, enabled, onChanged }: Options): void {
  const targets = useMemo(
    () =>
      (datePlans ?? [])
        .map((datePlan) => ({ id: datePlan.id, version: datePlan.version }))
        .sort((a, b) => a.id - b.id),
    [datePlans],
  )

  // 지켜볼 DatePlan 집합이 바뀌면 다른 조회가 된다. version은 key에 넣지 않는다 —
  // 편집마다 key가 바뀌면 확인 주기가 처음부터 다시 시작된다.
  const datePlanIdsKey = useMemo(() => targets.map((target) => target.id).join(','), [targets])

  const active = enabled && Boolean(tripId) && targets.length > 0

  const { data, dataUpdatedAt } = useQuery({
    queryKey: tripKeys.planVersionProbe(tripId ?? '', datePlanIdsKey),
    queryFn: ({ signal }) => fetchDatePlanVersions(targets.map((target) => target.id), signal),
    enabled: active,
    refetchInterval: active ? VERSION_POLL_INTERVAL_MS : false,
    // 확인 결과를 들고 있을 이유가 없다. 앱으로 돌아온 직후 낡은 값으로 판단하지 않게 매번 새로 읽는다
    staleTime: 0,
    gcTime: 0,
    // 배경 확인이라 재시도로 요청을 늘리지 않는다. 실패하면 다음 주기에 다시 묻는다
    retry: 0,
  })

  // 호출부가 매 렌더 새 함수를 넘겨도 아래 effect가 다시 돌지 않게 한다
  const onChangedRef = useRef(onChanged)
  useEffect(() => {
    onChangedRef.current = onChanged
  }, [onChanged])

  // 같은 응답으로 전체 조회를 두 번 시작하지 않는다
  const handledAtRef = useRef(0)

  useEffect(() => {
    if (!data || dataUpdatedAt === 0) return
    if (handledAtRef.current === dataUpdatedAt) return
    handledAtRef.current = dataUpdatedAt
    // 멈춰 있는 동안(편집·드래그) 도착한 응답은 비교하지 않고 넘긴다. 편집 직전에 출발한
    // 확인이 편집 뒤에 도착하면 방금 올린 version과 달라 보여서 쓸데없이 전체 조회를 돈다.
    // 실제로 다른 멤버의 편집이 있었다면 다시 켜진 뒤 다음 주기가 잡아낸다.
    if (!active) return

    const changed = targets.some((target) => {
      const serverVersion = data[target.id]
      return serverVersion !== undefined && serverVersion !== target.version
    })

    if (changed) onChangedRef.current()
  }, [active, data, dataUpdatedAt, targets])
}
