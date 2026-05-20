import { useAuthStore } from '@/app/store/auth-store'
import { mockCreateTrip, mockGetTripStatus } from '@/mocks/trip'
import { mockGetTrips } from '@/mocks/trips'
import { apiClient } from '@/shared/api/client'
import type {
  Trip,
  TripCreateRequest,
  TripCreateResponse,
  TripListResponse,
  TripStatusResponse,
} from '../types/trip-types'

const useMockTrips = import.meta.env.VITE_USE_MOCK_TRIPS !== 'false'
const useMockTrip = import.meta.env.VITE_USE_MOCK_TRIP === 'true'

const getTrips = async (): Promise<Trip[]> => {
  if (useMockTrips) return mockGetTrips()

  const token = useAuthStore.getState().accessToken
  const { data } = await apiClient.get<TripListResponse>('/trip/api', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data.body
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
