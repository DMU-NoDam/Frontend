import { useQuery } from '@tanstack/react-query'
import { tripApi } from '../api/trip-api'

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: tripApi.getTrips,
  })
}
