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
  TripUpdateRequest,
} from '../types/trip-types'

const useMockTrips = import.meta.env.VITE_USE_MOCK_TRIPS === 'true'
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

  // 생성 파이프라인 진입점 — 백엔드가 공항/장소를 동기 조회하므로 기본 5초로는 부족하다
  const { data } = await apiClient.post<TripCreateResponse>('/trip/api', request, {
    timeout: 30000,
  })
  return data
}

const getTripStatus = async (tripId: string): Promise<TripStatusResponse> => {
  if (useMockTrip) {
    return mockGetTripStatus(tripId)
  }

  const { data } = await apiClient.get<TripStatusResponse>(`/plan/api/${tripId}/status`)
  return data
}

// Trip creation pipeline steps 2–4 (async on the backend, fire-and-forget from here).
// No-op under mock mode since mockGetTripStatus already simulates the whole pipeline.
const generateDatePlans = async (tripId: string): Promise<void> => {
  if (useMockTrip) return
  await apiClient.post(`/trip/api/${tripId}/date-plans`)
}

const generatePlacePlans = async (tripId: string): Promise<void> => {
  if (useMockTrip) return
  await apiClient.post(`/trip/api/${tripId}/place-plans`)
}

const generateTransportPlans = async (tripId: string): Promise<void> => {
  if (useMockTrip) return
  await apiClient.post(`/trip/api/${tripId}/transport-plans`)
}

const updateTripFixed = async (tripId: string, fixed: boolean): Promise<void> => {
  await apiClient.patch(`/trip/api/${tripId}/fixed`, fixed, {
    headers: { 'Content-Type': 'application/json' },
  })
}

const updateTrip = async (tripId: string, request: TripUpdateRequest): Promise<void> => {
  await apiClient.put(`/trip/api/${tripId}`, request)
}

const deleteTrip = async (tripId: string): Promise<void> => {
  await apiClient.delete(`/trip/api/${tripId}`)
}

export const tripApi = {
  getTrips,
  createTrip,
  getTripStatus,
  generateDatePlans,
  generatePlacePlans,
  generateTransportPlans,
  updateTripFixed,
  updateTrip,
  deleteTrip,
}
