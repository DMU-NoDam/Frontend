import { useQuery } from '@tanstack/react-query'
import { weatherApi } from '../api/weather-api'
import { toolKeys } from '../query/tool-keys'

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
