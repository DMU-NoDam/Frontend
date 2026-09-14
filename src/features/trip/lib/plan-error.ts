import { isAxiosError } from 'axios'

// 일정 편집 API가 실패하는 방식. HTTP status만으로는 갈라낼 수 없다 —
// CONFLICT(0003)와 API_FAIL(0007)이 둘 다 409라서 반드시 응답 body의 code로 구분해야 한다.
export type PlanEditErrorKind =
  | 'conflict'   // 0003 다른 사람의 편집이 먼저 반영되어 이 동작이 무효가 됨
  | 'not-found'  // 0002 대상 DatePlan / PlacePlan / Place 가 없음
  | 'api-fail'   // 0007 외부 API(경로 등) 실패
  | 'unknown'

const CODE_TO_KIND: Record<string, PlanEditErrorKind> = {
  '0002': 'not-found',
  '0003': 'conflict',
  '0007': 'api-fail',
}

const MESSAGE: Record<PlanEditErrorKind, string> = {
  conflict: '다른 사람이 먼저 일정을 수정했어요. 최신 일정을 불러왔습니다.',
  'not-found': '이미 변경된 일정이에요. 최신 일정을 불러왔습니다.',
  'api-fail': '일정을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.',
  unknown: '일정을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.',
}

export function getPlanEditErrorKind(error: unknown): PlanEditErrorKind {
  if (!isAxiosError(error)) return 'unknown'
  const code = (error.response?.data as { code?: unknown } | undefined)?.code
  return (typeof code === 'string' && CODE_TO_KIND[code]) || 'unknown'
}

export function getPlanEditErrorMessage(error: unknown): string {
  return MESSAGE[getPlanEditErrorKind(error)]
}

// conflict / not-found는 서버가 이미 CAS 루프 안에서 rebase까지 끝낸 뒤 "이 동작은 적용할 수
// 없다"고 알려준 것이다. 같은 요청을 다시 보내도 결과가 같으므로 자동 재시도하지 않고,
// 최신 상태를 다시 읽어 사용자에게 보여준다.
export function shouldRefetchAfter(kind: PlanEditErrorKind): boolean {
  return kind === 'conflict' || kind === 'not-found'
}
