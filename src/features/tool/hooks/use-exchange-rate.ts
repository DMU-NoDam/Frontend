import { useQuery } from '@tanstack/react-query'
import { exchangeApi } from '../api/exchange-api'
import { toolKeys } from '../query/tool-keys'

// 백엔드가 통화 쌍마다 1시간 캐시하므로 그보다 자주 다시 불러올 필요가 없다
const STALE_MS = 30 * 60_000

export function useExchangeRate(base: string, target: string) {
  return useQuery({
    queryKey: toolKeys.exchangeRate(base, target),
    queryFn: () => exchangeApi.getLatestRate(base, target),
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  })
}
