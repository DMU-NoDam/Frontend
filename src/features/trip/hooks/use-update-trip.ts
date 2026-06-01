import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tripApi } from '../api/trip-api'
import { tripKeys } from '../query/trip-keys'
import type { TripUpdateRequest } from '../types/trip-types'

type UpdateTripVariables = {
  tripId: string
  request: TripUpdateRequest
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, request }: UpdateTripVariables) =>
      tripApi.updateTrip(tripId, request),
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.list() })
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
    },
  })
}
