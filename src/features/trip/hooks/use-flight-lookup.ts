import { useQuery } from '@tanstack/react-query'
import { flightApi } from '../api/flight-api'

export const useFlightLookup = (iata: string) => {
  return useQuery({
    queryKey: ['flight', iata],
    queryFn: () => flightApi.getFlightByIata(iata),
    enabled: iata.trim().length > 0,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  })
}
