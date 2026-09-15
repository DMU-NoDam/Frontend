import { mockCreateTrip, mockGetTripStatus, mockRunPlanStep } from '@/mocks/trip'
import { mockGetTrips } from '@/mocks/trips'
import { apiClient } from '@/shared/api/client'
import { mapTripSummary } from './trip-summary-mapper'
import type {
  TripCreateRequest,
  TripCreateResponse,
  TripListResponse,
  PlanStepResult,
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

// Trip creation pipeline steps 2–4. 백엔드가 동기로 바뀌어서(89a8429) 작업이 끝나야 응답이 온다 —
// 전역 timeout 5초로는 AI 일정 생성을 기다리지 못하고 ECONNABORTED로 죽는다.
const PLAN_STEP_TIMEOUT_MS = 300000

// 이미 같은 trip의 단계가 서버에서 돌고 있으면 백엔드 락(TripLockService)이 ALREADY_PROCESSING을
// 던지는데, 이 ErrorCode의 status가 202라 axios는 성공으로 넘겨준다. 그대로 통과시키면 실행되지도
// 않은 단계를 성공으로 보고 다음 단계를 빈 데이터 위에서 돌리게 되므로 응답 code로 구분한다.
const ALREADY_PROCESSING_CODE = '0006'

const isAlreadyProcessing = (data: unknown): boolean =>
  typeof data === 'object' &&
  data !== null &&
  (data as { code?: unknown }).code === ALREADY_PROCESSING_CODE

const postPlanStep = async (path: string): Promise<PlanStepResult> => {
  const { data } = await apiClient.post<unknown>(path, null, { timeout: PLAN_STEP_TIMEOUT_MS })
  return isAlreadyProcessing(data) ? 'locked' : 'done'
}

const generateDatePlans = async (tripId: string): Promise<PlanStepResult> => {
  if (useMockTrip) return mockRunPlanStep(tripId, 'CREATED')
  return postPlanStep(`/trip/api/${tripId}/date-plans`)
}

const generatePlacePlans = async (tripId: string): Promise<PlanStepResult> => {
  if (useMockTrip) return mockRunPlanStep(tripId, 'AI_PLANNED')
  return postPlanStep(`/trip/api/${tripId}/place-plans`)
}

const generateTransportPlans = async (tripId: string): Promise<PlanStepResult> => {
  if (useMockTrip) return mockRunPlanStep(tripId, 'TRANSPORT_PLANNED')
  return postPlanStep(`/trip/api/${tripId}/transport-plans`)
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
