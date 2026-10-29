import { mockGetWeather } from '@/mocks/weather'
import { apiClient } from '@/shared/api/client'
import type { WeatherForecast, WeatherResponse } from '../types/tool-types'

// 백엔드는 cityName을 region 테이블 이름으로 찾는다. mock 여행 이름("Tokyo Trip")은
// region에 없어서 404가 나므로, 여행 목록이 mock이면 날씨도 mock으로 맞춘다.
const useMockTrips = import.meta.env.VITE_USE_MOCK_TRIPS === 'true'

// 하루치만 필요하므로 startDate = endDate로 조회한다
const getWeather = async (cityName: string, date: string): Promise<WeatherForecast> => {
  if (useMockTrips) return mockGetWeather(cityName, date)

  const { data } = await apiClient.get<WeatherResponse>('/weather/public/forecast', {
    params: { cityName, startDate: date, endDate: date },
  })
  return data.body
}

export const weatherApi = {
  getWeather,
}
