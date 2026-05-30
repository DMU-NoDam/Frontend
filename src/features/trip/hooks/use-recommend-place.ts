import { useMutation } from '@tanstack/react-query'
import { planApi } from '../api/plan-api'
import type { RecommendPlaceRequest } from '../types/plan-types'

export function useRecommendPlace() {
  return useMutation({
    mutationFn: (req: RecommendPlaceRequest) => planApi.recommendPlace(req),
  })
}
