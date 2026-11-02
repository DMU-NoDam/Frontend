import type { DatePlan, PlacePlan, PlanEditTarget } from '../types/plan-types'
import { sortPlansByOrder } from './plan-order'

// 편집 요청은 대상 DatePlan의 id와, 내가 마지막으로 읽은 version을 함께 보낸다.
// 캐시에서 그 DatePlan을 찾지 못하면(아직 안 읽었거나 이미 사라짐) 보낼 version이 없으므로
// 편집을 시작하지 않는다 — 임의의 값을 넣으면 서버가 엉뚱한 지점부터 rebase한다.
export function findEditTarget(
  datePlans: DatePlan[] | undefined,
  datePlanId: number,
): PlanEditTarget | null {
  const datePlan = datePlans?.find((d) => d.id === datePlanId)
  return datePlan ? { datePlanId: datePlan.id, version: datePlan.version } : null
}

// 어떤 장소 "바로 다음"에 끼울 자리. add-place는 위치를 인덱스가 아니라 이웃으로 받는다 —
// previous는 기준 장소 자신이고, next는 지금 순서에서 그 뒤에 오는 장소다(없으면 맨 뒤).
//
// previous를 항상 채우므로 백엔드가 409로 막는 "앞뒤 모두 null"은 생기지 않는다.
// (빈 DatePlan에 처음 넣는 것은 백엔드가 지원하지 않는다)
export function findInsertPositionAfter(
  datePlans: DatePlan[] | undefined,
  plan: PlacePlan,
): { previousPlacePlanId: number; nextPlacePlanId: number | null } | null {
  const datePlan = datePlans?.find((d) => d.id === plan.datePlanId)
  if (!datePlan) return null

  const ordered = sortPlansByOrder(datePlan.plans)
  const index = ordered.findIndex((p) => p.id === plan.id)
  if (index < 0) return null

  return { previousPlacePlanId: plan.id, nextPlacePlanId: ordered[index + 1]?.id ?? null }
}
