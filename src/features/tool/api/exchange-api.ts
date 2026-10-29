import axios from 'axios'
import type { ExchangeRate } from '../types/tool-types'

type FreeCurrencyLatestResponse = {
  data: Record<string, number>
}

const API_KEY = import.meta.env.VITE_FREECURRENCY_API_KEY as string | undefined

// 우리 백엔드가 아닌 외부 API라 토큰 인터셉터가 붙은 apiClient를 쓰지 않는다
const getLatestRate = async (base: string, target: string): Promise<ExchangeRate> => {
  if (!API_KEY) throw new Error('VITE_FREECURRENCY_API_KEY가 설정되지 않았습니다')

  const { data } = await axios.get<FreeCurrencyLatestResponse>(
    'https://api.freecurrencyapi.com/v1/latest',
    {
      params: { apikey: API_KEY, base_currency: base, currencies: target },
      timeout: 5000,
    },
  )

  const rate = data.data[target]
  if (typeof rate !== 'number') throw new Error(`환율 응답에 ${target}가 없습니다`)

  return { base, target, rate, fetchedAt: Date.now() }
}

export const exchangeApi = {
  getLatestRate,
}
