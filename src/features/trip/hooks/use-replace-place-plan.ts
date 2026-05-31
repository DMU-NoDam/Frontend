import { useMutation, useQueryClient } from '@tanstack/react-query'
import { planApi } from '../api/plan-api'
import { tripKeys } from '../query/trip-keys'
import type { PlacePlan, PlanListResponse, ReplacePlacePlanRequest } from '../types/plan-types'

export function useReplacePlacePlan(tripId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: ReplacePlacePlanRequest) => planApi.replacePlacePlan(req),
    onSuccess: (updatedPlan: PlacePlan, req: ReplacePlacePlanRequest) => {
      if (!tripId) return
      queryClient.setQueryData<PlanListResponse>(
        tripKeys.plans(tripId),
        (old) => {
          if (!old) return old
          const newBody = { ...old.body }
          for (const theme of Object.keys(newBody) as (keyof typeof newBody)[]) {
            newBody[theme] = newBody[theme].map((p) =>
              p.id === req.oldPlacePlanId
                ? { ...updatedPlan, date: p.date, startTime: p.startTime, endTime: p.endTime }
                : p,
            )
          }
          return { ...old, body: newBody }
        },
      )
    },
  })
}
