import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memoApi } from '../api/memo-api'
import { toolKeys } from '../query/tool-keys'
import type { MemoRequest } from '../types/tool-types'

export function useMemos(tripId: string) {
  return useQuery({
    queryKey: toolKeys.memos(tripId),
    queryFn: () => memoApi.getMemos(tripId),
  })
}

export function useCreateMemo(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: MemoRequest) => memoApi.createMemo(tripId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: toolKeys.memos(tripId) }),
  })
}

export function useUpdateMemo(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memoId, request }: { memoId: number; request: MemoRequest }) =>
      memoApi.updateMemo(memoId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: toolKeys.memos(tripId) }),
  })
}

export function useDeleteMemo(tripId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memoId: number) => memoApi.deleteMemo(memoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: toolKeys.memos(tripId) }),
  })
}
