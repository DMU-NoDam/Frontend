import { useQuery } from '@tanstack/react-query'
import { planApi } from '../api/plan-api'

export const useTripPlans = (tripId: string | undefined) => {
  return useQuery({
    queryKey: ['trip-plans', tripId],
    queryFn: () => planApi.getPlans(tripId!),
    enabled: Boolean(tripId),
  })
}
