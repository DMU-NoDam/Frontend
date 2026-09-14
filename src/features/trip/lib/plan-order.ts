import type { PlacePlan } from '../types/plan-types'

// 일정 순서는 orderIndex가 기준이다. startTime으로 정렬하면 안 된다 — 순서를 바꾸면
// 백엔드가 시간을 비동기로 다시 계산하므로, 그 사이에는 startTime이 옛 순서를 가리킨다.
//
// orderIndex는 DatePlan(날짜 x 테마) 안에서만 유효한 값이라, 하루치처럼 같은 DatePlan에
// 속한 목록에만 쓴다. 날짜를 섞은 배열은 먼저 날짜로 나눠야 한다.
export function sortPlansByOrder(plans: PlacePlan[]): PlacePlan[] {
  return [...plans].sort((a, b) => a.orderIndex - b.orderIndex)
}
