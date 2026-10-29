import { useQuery } from '@tanstack/react-query'
import { exchangeApi } from '../api/exchange-api'
import { toolKeys } from '../query/tool-keys'
import type { ExchangeRate } from '../types/tool-types'

// FreeCurrencyAPI 무료 키는 월 호출 한도가 있고 모든 사용자가 같은 키를 쓴다.
// 결과를 1시간 동안 브라우저에 보관해서 새로고침/탭 이동마다 호출하지 않게 한다.
const CACHE_MS = 60 * 60_000

const cacheKey = (base: string, target: string) => `arubi-exchange-rate:${base}:${target}`

function readCache(base: string, target: string): ExchangeRate | undefined {
  try {
    const raw = localStorage.getItem(cacheKey(base, target))
    return raw ? (JSON.parse(raw) as ExchangeRate) : undefined
  } catch {
    return undefined
  }
}

function writeCache(rate: ExchangeRate) {
  try {
    localStorage.setItem(cacheKey(rate.base, rate.target), JSON.stringify(rate))
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 메모리 캐시만 쓴다
  }
}

export function useExchangeRate(base: string, target: string) {
  const cached = readCache(base, target)

  return useQuery({
    queryKey: toolKeys.exchangeRate(base, target),
    queryFn: async () => {
      const rate = await exchangeApi.getLatestRate(base, target)
      writeCache(rate)
      return rate
    },
    initialData: cached,
    initialDataUpdatedAt: cached?.fetchedAt,
    staleTime: CACHE_MS,
    refetchOnWindowFocus: false,
  })
}
