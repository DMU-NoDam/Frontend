import { mockCreateMemo, mockDeleteMemo, mockGetMemos, mockUpdateMemo } from '@/mocks/memos'
import { apiClient } from '@/shared/api/client'
import type { Memo, MemoListResponse, MemoRequest, MemoResponse } from '../types/tool-types'

// 메모는 여행 id에 묶여 있어서, 여행 목록을 mock으로 쓰면 메모도 mock이어야 한다
const useMockTrips = import.meta.env.VITE_USE_MOCK_TRIPS === 'true'

const getMemos = async (tripId: string): Promise<Memo[]> => {
  if (useMockTrips) return mockGetMemos(tripId)

  const { data } = await apiClient.get<MemoListResponse>(`/memo/api/${tripId}`)
  return data.body
}

const createMemo = async (tripId: string, request: MemoRequest): Promise<Memo> => {
  if (useMockTrips) return mockCreateMemo(tripId, request)

  const { data } = await apiClient.post<MemoResponse>(`/memo/api/${tripId}`, request)
  return data.body
}

const updateMemo = async (memoId: number, request: MemoRequest): Promise<Memo> => {
  if (useMockTrips) return mockUpdateMemo(memoId, request)

  const { data } = await apiClient.put<MemoResponse>(`/memo/api/${memoId}`, request)
  return data.body
}

const deleteMemo = async (memoId: number): Promise<void> => {
  if (useMockTrips) return mockDeleteMemo(memoId)

  await apiClient.delete(`/memo/api/${memoId}`)
}

export const memoApi = {
  getMemos,
  createMemo,
  updateMemo,
  deleteMemo,
}
