import type { FlightApiBody, PlanStatus, PlanStepResult, TripCreateRequest, TripCreateResponse, TripStatusResponse } from '@/features/trip/types/trip-types'

const MOCK_TRIP_ID = 1
// 일정 생성 전체 소요 시간. 실서버처럼 파이프라인 3단계에 나눠 쓴다.
const MOCK_PLANNING_DURATION_MS = Number(import.meta.env.VITE_MOCK_TRIP_PLANNING_MS ?? 8000)
const MOCK_STEP_DURATION_MS = MOCK_PLANNING_DURATION_MS / 3

// 클라이언트가 단계를 호출해야 전진하는 실서버 파이프라인을 그대로 흉내낸다.
// 시간이 지나면 저절로 완료되던 이전 mock은 단계 호출을 검증하지 못했다.
type MockPlanState = { planStatus: PlanStatus | null; planning: boolean }
const mockPlanState = new Map<string, MockPlanState>()

export const mockCreateTrip = async (
  request: TripCreateRequest,
): Promise<TripCreateResponse> => {
  void request
  // Trip 생성 직후에는 DatePlan이 없어 planStatus 자체가 없다 (실서버와 동일)
  mockPlanState.set(String(MOCK_TRIP_ID), { planStatus: null, planning: false })

  return Promise.resolve({
    message: 'success',
    body: { id: MOCK_TRIP_ID },
  })
}

export const mockGetTripStatus = async (
  tripId: string,
): Promise<TripStatusResponse> => {
  // 기록에 없는 tripId(이전 세션의 sessionStorage 잔여값 등)는 완료로 본다 —
  // 생성 오버레이가 영영 걷히지 않는 것보다 낫다.
  const state = mockPlanState.get(tripId) ?? { planStatus: 'TRANSPORT_PLANNED', planning: false }

  return Promise.resolve({
    message: 'success',
    body: { ...state },
  })
}

// 동기 단계 호출 mock: 실서버처럼 작업이 끝난 뒤에 응답하고 planStatus를 올린다.
export const mockRunPlanStep = async (
  tripId: string,
  next: PlanStatus,
): Promise<PlanStepResult> => {
  const key = String(tripId)
  const planStatus = mockPlanState.get(key)?.planStatus ?? null
  mockPlanState.set(key, { planStatus, planning: true })

  await new Promise((resolve) => setTimeout(resolve, MOCK_STEP_DURATION_MS))

  mockPlanState.set(key, { planStatus: next, planning: false })
  return 'done'
}

export const mockFlightLookup = async (
  flightIata: string,
  date: string,
): Promise<FlightApiBody> => {
  return Promise.resolve({
    flightIata,
    departureAirport: 'ICN',
    arrivalAirport: 'NRT',
    departureTime: `${date}T10:00:00`,
    arrivalTime: `${date}T12:30:00`,
  })
}
