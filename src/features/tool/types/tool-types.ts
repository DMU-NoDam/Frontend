// ── Memo ─────────────────────────────────────────────────────

export type MemoIconType =
  | 'HOTEL'
  | 'FOOD'
  | 'TRANSPORT'
  | 'SHOPPING'
  | 'SIGHTSEEING'
  | 'IMPORTANT'
  | 'IDEA'
  | 'ETC'

export type Memo = {
  id: number
  icon: MemoIconType
  title: string
  content: string | null
}

export type MemoRequest = {
  icon: MemoIconType
  title: string
  content: string
}

export type MemoResponse = {
  message: string
  body: Memo
}

export type MemoListResponse = {
  message: string
  body: Memo[]
}

// ── Weather ──────────────────────────────────────────────────

export type DailyWeather = {
  date: string
  maxTemperature: number
  minTemperature: number
  weatherCode: number
  sourceType: 'FORECAST' | 'CLIMATE'
}

// 여행 시작일이 7일보다 멀면 백엔드가 forecast를 빈 배열로 내려준다(ClimateService)
export type WeatherForecast = {
  cityName: string
  forecast: DailyWeather[]
  message: string
}

export type WeatherResponse = {
  message: string
  body: WeatherForecast
}

// ── Exchange rate ────────────────────────────────────────────

export type ExchangeRate = {
  base: string
  target: string
  // 1 base = rate target
  rate: number
  fetchedAt: number
}

// ── Checklist ────────────────────────────────────────────────

export type ChecklistItem = {
  id: string
  label: string
  checked: boolean
}
