import { mockCreateTrip, mockGetTripStatus } from '@/mocks/trip'
import { mockGetTrips } from '@/mocks/trips'
import { apiClient } from '@/shared/api/client'
import { mapTripSummary } from './trip-summary-mapper'
import type {
  TripCreateRequest,
  TripCreateResponse,
  TripListResponse,
  TripSummary,
  TripStatusResponse,
} from '../types/trip-types'

const useMockTrips = import.meta.env.VITE_USE_MOCK_TRIPS !== 'false'
const useMockTrip = import.meta.env.VITE_USE_MOCK_TRIP === 'true'

const getTrips = async (): Promise<TripSummary[]> => {
  if (useMockTrips) {
    const data = await mockGetTrips()
    return data.map(mapTripSummary)
  }

  const { data } = await apiClient.get<TripListResponse>('/trip/api')
  return data.body.map(mapTripSummary)
}

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
  getTrips,
  createTrip,
  getTripStatus,
}
