import { mockCreateTrip, mockGetTripStatus } from '@/mocks/trip'
import { apiClient } from '@/shared/api/client'
import type { TripCreateRequest, TripCreateResponse, TripStatusResponse } from '../types/trip-types'

const useMockTrip = import.meta.env.VITE_USE_MOCK_TRIP === 'true'

const createTrip = async (request: TripCreateRequest): Promise<TripCreateResponse> => {
  if (useMockTrip) {
    return mockCreateTrip(request)
  }

  const { data } = await apiClient.post<TripCreateResponse>('/trip/api', request)
  return data
}

const getTripStatus = async (tripId: string): Promise<TripStatusResponse> => {
  if (useMockTrip) {
    return mockGetTripStatus(tripId)
  }

  const { data } = await apiClient.get<TripStatusResponse>(`/trip/api/${tripId}`)
  return data
}

export const tripApi = {
  createTrip,
  getTripStatus,
}
