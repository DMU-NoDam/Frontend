import type { WeatherForecast } from '@/features/tool/types/tool-types'

// 백엔드와 같은 규칙: 시작일이 7일보다 멀면 예보 없이 안내 메시지만 내려준다
export const mockGetWeather = (cityName: string, date: string): Promise<WeatherForecast> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntil = Math.round((new Date(date).getTime() - today.getTime()) / 86_400_000)

  if (daysUntil > 7) {
    return Promise.resolve({
      cityName,
      forecast: [],
      message: '여행 시작일이 7일을 초과하여 월별 기후 데이터 조회 예정입니다.',
    })
  }

  return Promise.resolve({
    cityName,
    forecast: [
      { date, maxTemperature: 26, minTemperature: 18, weatherCode: 0, sourceType: 'FORECAST' },
    ],
    message: '날씨 예보 조회 성공',
  })
}
