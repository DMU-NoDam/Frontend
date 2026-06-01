import { mockDeletePlacePlan, mockGetPlans, mockRecommendPlace, mockReplacePlacePlan } from '@/mocks/plans'
import { apiClient } from '@/shared/api/client'
import type {
  PlacePlan,
  PlanListResponse,
  RawPlanListResponse,
  RecommendedPlaceItem,
  RecommendPlaceRequest,
  RecommendPlaceResponse,
  ReplacePlacePlanRequest,
  ReplacePlacePlanResponse,
  TripThemeConfirmResponse,
  TripThemeType,
} from '../types/plan-types'
import { mapPlanListResponse, mapRecommendedPlaceItems, mapReplacedPlacePlan } from './plan-mapper'

const useMockPlans = import.meta.env.VITE_USE_MOCK_TRIPS !== 'false'

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

const replacePlacePlan = async (req: ReplacePlacePlanRequest): Promise<PlacePlan> => {
  if (useMockPlans) return mockReplacePlacePlan(req.oldPlacePlanId, req.newPlaceId)
  const { data } = await apiClient.put<ReplacePlacePlanResponse>('/plan/api/place-plan', req, {
    timeout: 60000,
  })
  return mapReplacedPlacePlan(data.body)
}

const deletePlacePlan = async (placePlanId: number): Promise<void> => {
  if (useMockPlans) return mockDeletePlacePlan()
  await apiClient.delete(`/plan/api/place-plan/${placePlanId}`, {
    timeout: 120000,
  })
}

export const planApi = {
  getPlans,
  confirmTheme,
  recommendPlace,
  replacePlacePlan,
  deletePlacePlan,
}
