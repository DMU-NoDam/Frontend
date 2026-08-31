import { useQuery } from '@tanstack/react-query'
import { tripMemberApi } from '../api/trip-member-api'
import { tripKeys } from '../query/trip-keys'

export function useTripMembers(tripId: string | undefined) {
  return useQuery({
    queryKey: tripKeys.members(tripId ?? ''),
    queryFn: () => tripMemberApi.getMembers(tripId!),
    enabled: !!tripId,
  })
}
