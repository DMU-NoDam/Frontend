import type { Memo, MemoRequest } from '@/features/tool/types/tool-types'

// tripId별 메모. 새로고침하면 초기 상태로 돌아간다.
const memosByTrip = new Map<string, Memo[]>([
  [
    '1',
    [
      { id: 1, icon: 'HOTEL', title: '호텔 체크인', content: '체크인 번호: 3458208629' },
      { id: 2, icon: 'TRANSPORT', title: '공항 픽업 택시', content: '택시 번호: ふ 89-12' },
    ],
  ],
])

let nextId = 100

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 200))

export const mockGetMemos = (tripId: string): Promise<Memo[]> =>
  delay([...(memosByTrip.get(tripId) ?? [])])

export const mockCreateMemo = (tripId: string, request: MemoRequest): Promise<Memo> => {
  const memo: Memo = { id: nextId++, ...request }
  // 백엔드처럼 최신순으로 보여준다
  memosByTrip.set(tripId, [memo, ...(memosByTrip.get(tripId) ?? [])])
  return delay(memo)
}

export const mockUpdateMemo = (memoId: number, request: MemoRequest): Promise<Memo> => {
  for (const [tripId, memos] of memosByTrip) {
    const target = memos.find((m) => m.id === memoId)
    if (!target) continue
    const updated = { ...target, ...request }
    memosByTrip.set(tripId, memos.map((m) => (m.id === memoId ? updated : m)))
    return delay(updated)
  }
  return Promise.reject(new Error('memo not found'))
}

export const mockDeleteMemo = (memoId: number): Promise<void> => {
  for (const [tripId, memos] of memosByTrip) {
    memosByTrip.set(tripId, memos.filter((m) => m.id !== memoId))
  }
  return delay(undefined)
}
