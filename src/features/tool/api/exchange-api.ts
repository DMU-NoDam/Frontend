import { apiClient } from '@/shared/api/client'
import type { ExchangeRate } from '../types/tool-types'

type ExchangeRateResponse = {
  message: string
  body: {
    base: string
    target: string
    rate: number
    // 백엔드가 외부 API에서 환율을 받아온 시각 (epoch millis)
    updatedAt: number
  }
}

// 외부 환율 API(FreeCurrencyAPI)는 백엔드가 키를 들고 대신 호출하고 1시간 캐시한다
const getLatestRate = async (base: string, target: string): Promise<ExchangeRate> => {
  const { data } = await apiClient.get<ExchangeRateResponse>('/exchange/public/rate', {
    params: { base, target },
  })
  const { rate, updatedAt } = data.body
  return { base, target, rate, fetchedAt: updatedAt }
}

export const exchangeApi = {
  getLatestRate,
}
