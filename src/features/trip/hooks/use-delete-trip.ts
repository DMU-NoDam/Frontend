import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tripApi } from '../api/trip-api'
import { tripKeys } from '../query/trip-keys'

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (tripId: string) => tripApi.deleteTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.list() })
      navigate('/trips')
    },
  })
}
