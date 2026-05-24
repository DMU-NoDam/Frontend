import { useQuery } from '@tanstack/react-query'
import { planApi } from '../api/plan-api'
import { tripKeys } from '../query/trip-keys'

export const useTripPlans = (tripId: string | undefined) => {
  return useQuery({
    queryKey: tripKeys.plans(tripId ?? ''),
    queryFn: () => planApi.getPlans(tripId!),
    enabled: Boolean(tripId),
  })
}
