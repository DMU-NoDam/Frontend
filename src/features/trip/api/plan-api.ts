import {
  mockAddPlace,
  mockChangePlace,
  mockGetDatePlanVersion,
  mockGetPlacePlanTransport,
  mockGetPlans,
  mockGetTransportPlanDetail,
  mockMovePlace,
  mockRecommendPlace,
  mockRemovePlace,
} from '@/mocks/plans'
import { mockConfirmTheme } from '@/mocks/trips'
import { apiClient } from '@/shared/api/client'
import type {
  AddPlaceRequest,
  ChangePlaceRequest,
  DatePlan,
  DatePlanResponse,
  DatePlanVersionResponse,
  MovePlaceRequest,
  PlacePlanTransport,
  PlacePlanTransportResponse,
  PlanEditTarget,
  RemovePlaceRequest,
  PlanListResponse,
  RawPlanListResponse,
  RecommendedPlaceItem,
  RecommendPlaceRequest,
  RecommendPlaceResponse,
  Transport,
  TransportPlanDetailResponse,
  TripThemeConfirmResponse,
  TripThemeType,
} from '../types/plan-types'
import {
  mapDatePlan,
  mapPlacePlanTransport,
  mapPlanListResponse,
  mapRecommendedPlaceItems,
  mapTransport,
} from './plan-mapper'

const useMockPlans = import.meta.env.VITE_USE_MOCK_TRIPS === 'true'

// signal: react-query가 넘겨주는 것을 그대로 axios에 전달한다. 폴링을 끄는 것만으로는 이미
// 날아간 요청이 멈추지 않아서, 편집 직전에 query를 취소해도 낡은 응답이 뒤늦게 도착한다.
const getPlans = async (tripId: string, signal?: AbortSignal): Promise<PlanListResponse> => {
  if (useMockPlans) {
    return mockGetPlans(tripId)
  }
  const { data } = await apiClient.get<RawPlanListResponse>(`/plan/api/${tripId}`, { signal })
  return mapPlanListResponse(data)
}

// 일정 변경 감지용. 응답은 그 DatePlan에 적용된 편집 횟수뿐이라 전체 조회보다 훨씬 가볍다.
// null(기록 없음)은 0으로 맞춘다 — 그래야 캐시의 초기 version 0과 같아져 무한 재조회가 없다.
const getDatePlanVersion = async (datePlanId: number, signal?: AbortSignal): Promise<number> => {
  if (useMockPlans) return mockGetDatePlanVersion(datePlanId)

  const { data } = await apiClient.get<DatePlanVersionResponse>(
    `/plan/api/${datePlanId}/version`,
    { signal },
  )
  return data.body ?? 0
}

// 계산 중인 이동 구간 확인용. 한 장소의 앞뒤 구간만 내려온다 (경로 polygon 포함).
const getPlacePlanTransport = async (
  datePlanId: number,
  placePlanId: number,
  signal?: AbortSignal,
): Promise<PlacePlanTransport> => {
  if (useMockPlans) return mockGetPlacePlanTransport(datePlanId, placePlanId)

  const { data } = await apiClient.get<PlacePlanTransportResponse>(
    `/plan/api/${datePlanId}/place-plan/${placePlanId}/transport`,
    { signal },
  )
  return mapPlacePlanTransport(data.body)
}

// 이동 구간 하나의 상세. 전체 조회와 앞뒤 구간 조회에 이미 routeInfo가 들어 있으므로,
// 어떤 이유로든 경로가 빠진 구간을 골랐을 때만 쓰는 보조 경로다.
const getTransportPlanDetail = async (
  transportPlanId: number,
  signal?: AbortSignal,
): Promise<Transport | null> => {
  if (useMockPlans) return mockGetTransportPlanDetail(transportPlanId)

  const { data } = await apiClient.get<TransportPlanDetailResponse>(
    `/plan/api/transport-plan/${transportPlanId}`,
    { signal },
  )
  return data.body ? mapTransport(data.body) : null
}

const confirmTheme = async (
  tripId: string,
  theme: TripThemeType,
): Promise<TripThemeConfirmResponse> => {
  if (useMockPlans) return mockConfirmTheme(tripId, theme)

  const { data } = await apiClient.patch<TripThemeConfirmResponse>(
    `/trip/api/${tripId}/theme`,
    theme,
    { headers: { 'Content-Type': 'application/json' } },
  )
  return data
}

const recommendPlace = async (req: RecommendPlaceRequest): Promise<RecommendedPlaceItem[]> => {
  if (useMockPlans) return mockRecommendPlace()
  const { data } = await apiClient.post<RecommendPlaceResponse>('/place/api/recommend', req, {
    timeout: 60000,
  })
  return mapRecommendedPlaceItems(data.body)
}

// PlacePlan 편집 4종 (CAS). 백엔드는 CAS 루프를 돌고 이벤트만 발행한 뒤 응답한다 —
// 경로(TransportPlan) 계산은 별도 스레드로 빠져 있어서 이 요청이 기다리지 않는다.
// 그래도 기본 5초로는 CAS 경합이 붙을 때 빠듯해 넉넉히 준다 (구 API의 60~120초는 동기로
// 경로까지 계산하던 시절의 값이라 더 이상 필요 없다).
const PLAN_EDIT_TIMEOUT_MS = 30000

const postPlanEdit = async (
  { datePlanId, version }: PlanEditTarget,
  action: string,
  body: Record<string, number | null>,
): Promise<DatePlan> => {
  const { data } = await apiClient.post<DatePlanResponse>(
    `/plan/api/${datePlanId}/${action}`,
    body,
    { params: { version }, timeout: PLAN_EDIT_TIMEOUT_MS },
  )
  return mapDatePlan(data.body)
}

const addPlace = async (req: AddPlaceRequest): Promise<DatePlan> => {
  if (useMockPlans) return mockAddPlace(req)
  return postPlanEdit(req, 'add-place', {
    placeId: req.placeId,
    previousPlacePlanId: req.previousPlacePlanId,
    nextPlacePlanId: req.nextPlacePlanId,
  })
}

const changePlace = async (req: ChangePlaceRequest): Promise<DatePlan> => {
  if (useMockPlans) return mockChangePlace(req)
  return postPlanEdit(req, 'change-place', {
    placePlanId: req.placePlanId,
    placeId: req.placeId,
  })
}

const movePlace = async (req: MovePlaceRequest): Promise<DatePlan> => {
  if (useMockPlans) return mockMovePlace(req)
  return postPlanEdit(req, 'move-place', {
    placePlanId: req.placePlanId,
    previousPlacePlanId: req.previousPlacePlanId,
    nextPlacePlanId: req.nextPlacePlanId,
  })
}

const removePlace = async (req: RemovePlaceRequest): Promise<DatePlan> => {
  if (useMockPlans) return mockRemovePlace(req)
  return postPlanEdit(req, 'remove-place', { placePlanId: req.placePlanId })
}

export const planApi = {
  getPlans,
  getDatePlanVersion,
  getPlacePlanTransport,
  getTransportPlanDetail,
  confirmTheme,
  recommendPlace,
  addPlace,
  changePlace,
  movePlace,
  removePlace,
}
