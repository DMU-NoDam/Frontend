import { useQuery } from '@tanstack/react-query'
import { weatherApi } from '../api/weather-api'
import { toolKeys } from '../query/tool-keys'

// 조회한 날짜의 하루치 예보. 헤더(숫자)와 배경 장면이 같은 값을 쓴다
export function useDayWeather(cityName: string | undefined, date: string | undefined) {
  const query = useWeather(cityName, date)
  const day = query.data?.forecast.find((d) => d.date === date) ?? query.data?.forecast[0]
  return { ...query, day }
}

export function useWeather(cityName: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: toolKeys.weather(cityName ?? '', date ?? ''),
    queryFn: () => weatherApi.getWeather(cityName!, date!),
    enabled: !!cityName && !!date,
    staleTime: 30 * 60_000,
    // 도시를 region에서 못 찾으면 404 — 다시 시도해도 결과가 같다
    retry: false,
  })
}
