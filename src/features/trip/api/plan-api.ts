import { apiClient } from '@/shared/api/client'
import type {
  PlanListResponse,
  TripThemeConfirmResponse,
  TripThemeType,
} from '../types/plan-types'

const getPlans = async (tripId: string): Promise<PlanListResponse> => {
  const { data } = await apiClient.get<PlanListResponse>(`/plan/api/${tripId}`)
  return data
}

const confirmTheme = async (
  tripId: string,
  theme: TripThemeType,
): Promise<TripThemeConfirmResponse> => {
  const { data } = await apiClient.patch<TripThemeConfirmResponse>(
    `/trip/api/${tripId}/theme`,
    theme,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
  return data
}

export const planApi = {
  getPlans,
  confirmTheme,
}
