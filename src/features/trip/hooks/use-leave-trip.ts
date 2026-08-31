import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tripMemberApi } from '../api/trip-member-api'
import { tripKeys } from '../query/trip-keys'

type LeaveTripVariables = {
  tripId: string
  newOwnerUserId?: number
}

export function useLeaveTrip() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ tripId, newOwnerUserId }: LeaveTripVariables) =>
      tripMemberApi.leaveTrip(tripId, newOwnerUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.list() })
      navigate('/trips')
    },
  })
}
