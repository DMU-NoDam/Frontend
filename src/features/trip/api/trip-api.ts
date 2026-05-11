import { useAuthStore } from '@/app/store/auth-store'
import { mockGetTrips } from '@/mocks/trips'
import { apiClient } from '@/shared/api/client'
import type { Trip, TripListResponse } from '../types/trip-types'

// API 준비 전까지 mock 사용. VITE_USE_MOCK_TRIPS=false 로 실 API로 전환
const useMock = import.meta.env.VITE_USE_MOCK_TRIPS !== 'false'

const getTrips = async (): Promise<Trip[]> => {
  if (useMock) return mockGetTrips()

  const token = useAuthStore.getState().accessToken
  const { data } = await apiClient.get<TripListResponse>('/trip/api', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data.body
}

export const tripApi = { getTrips }
