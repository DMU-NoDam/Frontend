import { useMutation, useQueryClient } from '@tanstack/react-query'
import { planApi } from '../api/plan-api'
import { tripKeys } from '../query/trip-keys'
import type { TripThemeType } from '../types/plan-types'

type ConfirmThemeVariables = {
  tripId: string
  theme: TripThemeType
}

export const useConfirmTripTheme = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, theme }: ConfirmThemeVariables) =>
      planApi.confirmTheme(tripId, theme),
    onSuccess: (_data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.list() })
      queryClient.invalidateQueries({ queryKey: tripKeys.plans(tripId) })
    },
  })
}
