import type { DatePlan } from '../types/plan-types'
import { sortPlansByOrder } from './plan-order'

// 일정을 편집하면 끊긴 이동 구간을 백엔드가 비동기로 다시 계산한다(PlacePlanUpdatedEvent ->
// TransportAsyncSingleThread). 완료를 알려주는 수단이 없어서 — 경로가 채워져도 DatePlan의
// version은 오르지 않는다 — 빈 구간이 남아 있는 동안만 목록을 다시 읽어 확인한다.
export const TRANSPORT_POLL_INTERVAL_MS = 5000

// 외부 경로 API가 실패하면(예: Navitime "route is not found") 그 구간은 영영 채워지지 않는다.
// 그때 무한히 폴링하지 않도록 창을 닫는다.
export const TRANSPORT_POLL_WINDOW_MS = 90000

// 아직 계산되지 않은 이동 구간이 남아 있는지.
//
// fromTransport는 "이 장소에서 다음 장소로 나가는" 구간이라, DatePlan의 마지막 일정은
// 원래 비어 있다. 그 외의 일정이 비어 있다면 서버가 아직 채우는 중이라는 뜻이다.
export function hasPendingTransport(datePlans: DatePlan[]): boolean {
  return datePlans.some((datePlan) =>
    sortPlansByOrder(datePlan.plans)
      .slice(0, -1)
      .some((plan) => plan.fromTransport === null),
  )
}

type PollInput = {
  datePlans: DatePlan[] | undefined
  paused: boolean
  // 폴링을 시작한 시각. 아직 안 하고 있으면 null
  pollingSince: number | null
  now: number
}

type PollDecision = {
  interval: number | false
  pollingSince: number | null
}

// 다음 재조회까지의 간격을 정한다.
//
// 횟수를 세지 않고 시각으로 판단하는 이유: react-query는 이 판단을 fetch할 때만이 아니라
// 렌더/상태 변화마다 다시 물어본다. 호출될 때마다 카운터를 올리면 실제 조회 횟수보다 훨씬
// 빨리 상한에 닿아, 경로가 채워지기 전에 폴링이 멈춘다(브라우저마다 렌더 횟수가 달라
// 멈추는 시점도 달라진다). 시각 기준이면 몇 번을 물어보든 결과가 같다.
export function planTransportPoll({
  datePlans,
  paused,
  pollingSince,
  now,
}: PollInput): PollDecision {
  // 채울 구간이 없으면 멈추고, 다음 편집을 위해 시작 시각을 지운다
  if (paused || !datePlans || !hasPendingTransport(datePlans)) {
    return { interval: false, pollingSince: null }
  }

  const startedAt = pollingSince ?? now
  if (now - startedAt >= TRANSPORT_POLL_WINDOW_MS) {
    return { interval: false, pollingSince: startedAt }
  }

  return { interval: TRANSPORT_POLL_INTERVAL_MS, pollingSince: startedAt }
}
