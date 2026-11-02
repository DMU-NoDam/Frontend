import type { DatePlan, PlanListResponse, Transport } from '../types/plan-types'
import { sortPlansByOrder } from './plan-order'

// 일정을 편집하면 끊긴 이동 구간을 백엔드가 비동기로 다시 계산한다(PlacePlanUpdatedEvent ->
// TransportAsyncSingleThread). 완료를 알려주는 수단이 없고 — 경로가 채워져도 DatePlan의
// version은 오르지 않는다 — 그래서 빈 구간이 남아 있는 동안만 그 구간을 직접 물어본다.
export const TRANSPORT_POLL_INTERVAL_MS = 5000

// 외부 경로 API가 실패하면(예: Navitime "route is not found") 그 구간은 영영 채워지지 않는다.
// 그때 무한히 폴링하지 않도록 창을 닫는다.
export const TRANSPORT_POLL_WINDOW_MS = 90000

// 한 번에 지켜볼 구간 수. 하루를 통째로 다시 계산하는 상황에서도 요청이 폭발하지 않게 막는다.
// 앞의 구간이 채워지면 다음 구간이 그 자리에 들어온다 (백엔드도 한 번에 한 구간씩 계산한다).
export const TRANSPORT_WATCH_LIMIT = 6

// 아직 채워지지 않은 인접 구간 하나.
//
// 출발 장소(fromPlacePlanId)로만 표현한다 — 같은 구간을 앞 장소와 뒤 장소에서 두 번
// 물어보지 않게 하는 가장 단순한 방법이다. 조회 API도 이 장소를 기준으로 호출한다.
export type PendingTransportLeg = {
  datePlanId: number
  // 요청을 보낸 시점의 DatePlan version. 응답을 반영하기 전에 이 값이 그대로인지 확인한다
  datePlanVersion: number
  fromPlacePlanId: number
  toPlacePlanId: number
}

// fromTransport는 "이 장소에서 다음 장소로 나가는" 구간이라, DatePlan의 마지막 일정은
// 원래 비어 있다. 그 외의 일정이 비어 있다면 서버가 아직 채우는 중이라는 뜻이다.
export function findPendingTransportLegs(datePlans: DatePlan[]): PendingTransportLeg[] {
  const legs: PendingTransportLeg[] = []

  for (const datePlan of datePlans) {
    const plans = sortPlansByOrder(datePlan.plans)

    for (let i = 0; i < plans.length - 1; i += 1) {
      if (plans[i].fromTransport !== null) continue

      legs.push({
        datePlanId: datePlan.id,
        datePlanVersion: datePlan.version,
        fromPlacePlanId: plans[i].id,
        toPlacePlanId: plans[i + 1].id,
      })
    }
  }

  return legs
}

// 같은 대기 상태인지 비교할 지문. 구간 묶음이 그대로면 기다린 시간도 이어서 센다.
export function pendingLegsSignature(legs: PendingTransportLeg[]): string {
  return legs
    .map((leg) => `${leg.datePlanId}:${leg.datePlanVersion}:${leg.fromPlacePlanId}>${leg.toPlacePlanId}`)
    .join(',')
}

// 받은 이동 구간을 캐시에 반영한다.
//
// 반영 대상은 언제나 transport.fromPlacePlanId의 fromTransport다 — 앞뒤 조회의
// previousTransport는 "앞 장소에서 나가는" 구간이므로 조회 기준 장소의 것이 아니다.
// 아래 조건이 하나라도 어긋나면 원본을 그대로 돌려준다 (늦게 도착한 응답이 최신 편집을
// 덮어쓰지 않게 한다):
//   - 요청 당시의 version과 지금 캐시의 version이 같아야 한다
//   - 지금 순서에서도 from 바로 다음이 to여야 한다
//   - 그 자리가 아직 비어 있어야 한다
export function applyTransportToPlans(
  plans: PlanListResponse,
  leg: PendingTransportLeg,
  transport: Transport,
): PlanListResponse {
  const datePlan = plans.datePlans.find((d) => d.id === leg.datePlanId)
  if (!datePlan || datePlan.version !== leg.datePlanVersion) return plans

  const ordered = sortPlansByOrder(datePlan.plans)
  const index = ordered.findIndex((plan) => plan.id === transport.fromPlacePlanId)
  if (index < 0) return plans
  if (ordered[index + 1]?.id !== transport.toPlacePlanId) return plans
  if (ordered[index].fromTransport !== null) return plans

  return {
    ...plans,
    datePlans: plans.datePlans.map((d) =>
      d.id !== datePlan.id
        ? d
        : {
            ...d,
            plans: d.plans.map((plan) =>
              plan.id === transport.fromPlacePlanId ? { ...plan, fromTransport: transport } : plan,
            ),
          },
    ),
  }
}

// 이동 구간 하나의 경로만 채운다 (상세 조회용). 그 구간이 지금도 캐시에 그대로 있고
// 경로가 비어 있을 때만 반영한다.
export function applyRouteInfoToPlans(
  plans: PlanListResponse,
  transportId: number,
  routeInfo: NonNullable<Transport['routeInfo']>,
): PlanListResponse {
  let changed = false

  const datePlans = plans.datePlans.map((datePlan) => ({
    ...datePlan,
    plans: datePlan.plans.map((plan) => {
      const { fromTransport } = plan
      if (!fromTransport || fromTransport.id !== transportId) return plan
      if (fromTransport.routeInfo !== null) return plan

      changed = true
      return { ...plan, fromTransport: { ...fromTransport, routeInfo } }
    }),
  }))

  return changed ? { ...plans, datePlans } : plans
}
