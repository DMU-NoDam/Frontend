import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tripApi } from '../api/trip-api'
import { tripKeys } from '../query/trip-keys'

type UpdateTripFixedVariables = {
  tripId: string
  fixed: boolean
}

export function useUpdateTripFixed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, fixed }: UpdateTripFixedVariables) =>
      tripApi.updateTripFixed(tripId, fixed),
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.list() })
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) })
    },
  })
}
