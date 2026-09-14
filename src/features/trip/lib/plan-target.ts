import type { DatePlan, PlanEditTarget } from '../types/plan-types'

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
