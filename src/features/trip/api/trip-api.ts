import { mockCreateTrip } from '@/mocks/trip'
import { apiClient } from '@/shared/api/client'
import type { TripCreateRequest, TripCreateResponse } from '../types/trip-types'

const useMockTrip = import.meta.env.VITE_USE_MOCK_TRIP === 'true'

const createTrip = async (request: TripCreateRequest): Promise<TripCreateResponse> => {
  if (useMockTrip) {
    return mockCreateTrip(request)
  }

  const { data } = await apiClient.post<TripCreateResponse>('/trip/api', request)
  return data
}

export const tripApi = {
  createTrip,
}
