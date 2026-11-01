// 일정 편집 mutation임을 표시하는 meta.
//
// 상시 폴링(use-trip-plans)이 편집이 끝날 때까지 기다리게 하는 데 쓴다. 편집 전에 출발한
// 조회가 편집 응답보다 늦게 도착하면, 방금 바꾼 순서가 한 단계 전으로 되돌아가 보인다.
export const PLAN_EDIT_META = { planEdit: true } as const

export function isPlanEditMeta(meta: unknown): boolean {
  return Boolean(
    meta && typeof meta === 'object' && 'planEdit' in meta && meta.planEdit === true,
  )
}
