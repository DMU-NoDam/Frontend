import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { planApi } from '../api/plan-api'
import {
  TRANSPORT_POLL_INTERVAL_MS,
  TRANSPORT_POLL_WINDOW_MS,
  hasPendingTransport,
} from '../lib/plan-transport'
import { tripKeys } from '../query/trip-keys'
import type { DatePlan } from '../types/plan-types'

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
  // 편집 중에는 멈춘다. 편집 모드에서는 경로를 보여주지 않아 폴링할 이유가 없고,
  // 도중에 목록이 새로 오면 드래그하던 순서가 서버 순서로 되돌아간다.
  pausePolling?: boolean
}

export const useTripPlans = (tripId: string | undefined, { pausePolling }: Options = {}) => {
  // 창이 닫히도록 안 채워진 작업의 signature. 외부 경로 API가 실패했을 가능성이 크므로
  // 그 작업에 대해서는 더 묻지 않는다. 편집이 새로 일어나면 signature가 달라져 다시 기다린다.
  const [abandonedSignature, setAbandonedSignature] = useState<string | null>(null)

  const query = useQuery({
    queryKey: tripKeys.plans(tripId ?? ''),
    queryFn: () => planApi.getPlans(tripId!),
    enabled: Boolean(tripId),
    meta: { globalLoading: true },
    // 캐시 상태에서 직접 판단한다 — 아래 isTransportPending을 참조하면 순환이 된다
    refetchInterval: (q) =>
      isWaitingForTransport(q.state.data?.datePlans, Boolean(pausePolling), abandonedSignature)
        ? TRANSPORT_POLL_INTERVAL_MS
        : false,
  })

  const datePlans = query.data?.datePlans
  const signature = datePlans ? signatureOf(datePlans) : ''
  const isTransportPending = isWaitingForTransport(
    datePlans,
    Boolean(pausePolling),
    abandonedSignature,
  )

  // 창이 다 지나면 포기한다. 그 전에 구간이 채워지면 isTransportPending이 꺼지면서 타이머도 정리된다.
  useEffect(() => {
    if (!isTransportPending) return

    const timer = setTimeout(() => setAbandonedSignature(signature), TRANSPORT_POLL_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [isTransportPending, signature])

  return { ...query, isTransportPending }
}
