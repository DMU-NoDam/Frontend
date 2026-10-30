import { useQuery } from '@tanstack/react-query'
import { weatherApi } from '../api/weather-api'
import { toolKeys } from '../query/tool-keys'

// 조회한 날짜의 하루치 예보와 지금 날씨. 헤더(숫자)와 배경 장면이 같은 값을 쓴다
export function useDayWeather(cityName: string | undefined, date: string | undefined) {
  const query = useWeather(cityName, date)
  const day = query.data?.forecast.find((d) => d.date === date) ?? query.data?.forecast[0]
  const current = query.data?.current ?? undefined
  return { ...query, day, current }
}

export function useWeather(cityName: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: toolKeys.weather(cityName ?? '', date ?? ''),
    queryFn: () => weatherApi.getWeather(cityName!, date!),
    enabled: !!cityName && !!date,
    // 지금 기온은 Open-Meteo가 15분마다 갱신한다
    staleTime: 15 * 60_000,
    // 도시를 region에서 못 찾으면 404 — 다시 시도해도 결과가 같다
    retry: false,
  })
}
