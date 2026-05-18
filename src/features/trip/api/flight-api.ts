import { mockFlightLookup } from '@/mocks/trip'
import { apiClient } from '@/shared/api/client'
import type { FlightApiBody, FlightApiResponse } from '../types/trip-types'

const useMockTrip = import.meta.env.VITE_USE_MOCK_TRIP === 'true'

const getFlightByIata = async (
  flightIata: string,
  date: string,
): Promise<FlightApiBody> => {
  if (useMockTrip) {
    return mockFlightLookup(flightIata, date)
  }

  const { data } = await apiClient.get<FlightApiResponse>(
    `/flight/public/${flightIata}`,
    {
      params: { date },
    },
  )
  return data.body
}

export const flightApi = {
  getFlightByIata,
}
