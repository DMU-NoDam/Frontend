import { useMutation } from '@tanstack/react-query'
import { planApi } from '../api/plan-api'
import type { TripThemeType } from '../types/plan-types'

type ConfirmThemeVariables = {
  tripId: string
  theme: TripThemeType
}

export const useConfirmTripTheme = () => {
  return useMutation({
    mutationFn: ({ tripId, theme }: ConfirmThemeVariables) =>
      planApi.confirmTheme(tripId, theme),
  })
}
