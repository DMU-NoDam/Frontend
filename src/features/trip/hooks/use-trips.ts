import { useQuery } from '@tanstack/react-query'
import { tripApi } from '../api/trip-api'
import { tripKeys } from '../query/trip-keys'

export function useTrips() {
  return useQuery({
    queryKey: tripKeys.list(),
    queryFn: tripApi.getTrips,
  })
}
