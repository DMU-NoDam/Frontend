import { useQuery } from '@tanstack/react-query'
import { flightApi } from '../api/flight-api'

export const useFlightLookup = (iata: string, date: string) => {
  return useQuery({
    queryKey: ['flight', iata, date],
    queryFn: () => flightApi.getFlightByIata(iata, date),
    enabled: iata.trim().length > 0 && date.trim().length > 0,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  })
}
