import { useMutation, useQueryClient } from '@tanstack/react-query'
import { planApi } from '../api/plan-api'
import { tripKeys } from '../query/trip-keys'
import type { PlanListResponse } from '../types/plan-types'

export function useDeletePlacePlan(tripId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (placePlanId: number) => planApi.deletePlacePlan(placePlanId),
    onSuccess: async (_: void, placePlanId: number) => {
      if (!tripId) return
      queryClient.setQueryData<PlanListResponse>(
        tripKeys.plans(tripId),
        (old) => {
          if (!old) return old
          const newBody = { ...old.body }
          for (const theme of Object.keys(newBody) as (keyof typeof newBody)[]) {
            newBody[theme] = newBody[theme].filter((p) => p.id !== placePlanId)
          }
          return { ...old, body: newBody }
        },
      )
      await queryClient.invalidateQueries({ queryKey: tripKeys.plans(tripId) })
    },
  })
}
