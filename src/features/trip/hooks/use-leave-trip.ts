import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tripMemberApi } from '../api/trip-member-api'
import { tripKeys } from '../query/trip-keys'

type LeaveTripVariables = {
  tripId: string
  // OWNER가 나갈 때만 필요(위임 대상). MEMBER는 생략한다.
  newOwnerUserId?: number
}

export function useLeaveTrip() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ tripId, newOwnerUserId }: LeaveTripVariables) =>
      tripMemberApi.leaveTrip(tripId, newOwnerUserId),
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.list() })
      // 나간 뒤에는 멤버/상세 조회 권한이 없다 - 재요청되지 않게 캐시를 지운다
      queryClient.removeQueries({ queryKey: tripKeys.members(tripId) })
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) })
      navigate('/trips')
    },
  })
}
