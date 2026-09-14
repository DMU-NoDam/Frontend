import { mockAddPlace, mockChangePlace, mockGetPlans, mockMovePlace, mockRecommendPlace, mockRemovePlace } from '@/mocks/plans'
import { apiClient } from '@/shared/api/client'
import type {
  AddPlaceRequest,
  ChangePlaceRequest,
  DatePlan,
  DatePlanResponse,
  MovePlaceRequest,
  PlanEditTarget,
  RemovePlaceRequest,
  PlanListResponse,
  RawPlanListResponse,
  RecommendedPlaceItem,
  RecommendPlaceRequest,
  RecommendPlaceResponse,
  TripThemeConfirmResponse,
  TripThemeType,
} from '../types/plan-types'
import { mapDatePlan, mapPlanListResponse, mapRecommendedPlaceItems } from './plan-mapper'

const useMockPlans = import.meta.env.VITE_USE_MOCK_TRIPS === 'true'

const getPlans = async (tripId: string): Promise<PlanListResponse> => {
  if (useMockPlans) {
    return mockGetPlans(tripId)
  }
  const { data } = await apiClient.get<RawPlanListResponse>(`/plan/api/${tripId}`)
  return mapPlanListResponse(data)
}

const confirmTheme = async (
  tripId: string,
  theme: TripThemeType,
): Promise<TripThemeConfirmResponse> => {
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
  confirmTheme,
  recommendPlace,
  addPlace,
  changePlace,
  movePlace,
  removePlace,
}
