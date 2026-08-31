import { useMutation, useQueryClient } from '@tanstack/react-query'
import { planApi } from '../api/plan-api'
import { tripKeys } from '../query/trip-keys'
import type { SwitchPlacePlanRequest } from '../types/plan-types'

export function useSwitchPlacePlan(tripId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: SwitchPlacePlanRequest) => planApi.switchPlacePlan(req),
    onSuccess: () => {
      if (!tripId) return
      queryClient.invalidateQueries({ queryKey: tripKeys.plans(tripId) })
    },
  })
}
