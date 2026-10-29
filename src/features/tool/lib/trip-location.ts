import { CITIES_BY_COUNTRY } from '@/features/trip/data/cities'
import type { City } from '@/features/trip/data/cities'
import type { TripSummary } from '@/features/trip/types/trip-types'

const COUNTRY_NAME: Record<string, string> = {
  JP: '일본',
}

const COUNTRY_CURRENCY: Record<string, string> = {
  JP: 'JPY',
}

// 지금은 일본 도시만 고를 수 있어서, 도시를 못 찾으면 엔화로 보여준다
const DEFAULT_TARGET_CURRENCY = 'JPY'

export type TripLocation = {
  cityName: string
  countryName: string | null
  currency: string
}

const ALL_CITIES: City[] = Object.values(CITIES_BY_COUNTRY).flat()

// 여행에 저장된 첫 번째 도시 코드로 도시를 찾는다.
// 도시 코드가 없는 예전 여행은 여행 이름 앞부분으로 찾는다 — 이름은 생성 시 도시 이름으로
// 만들어지지만("도쿄", "도쿄과 교토" — buildTripName) 사용자가 바꿨다면 못 찾을 수 있고,
// 그때는 이름을 그대로 도시명으로 쓴다.
function findCity(trip: TripSummary): City | undefined {
  const byCode = ALL_CITIES.find((c) => c.id === trip.regionCodes[0])
  if (byCode) return byCode

  return ALL_CITIES
    .filter((c) => trip.name.startsWith(c.name))
    .sort((a, b) => b.name.length - a.name.length)[0]
}

export function getTripLocation(trip: TripSummary): TripLocation {
  const city = findCity(trip)

  if (!city) {
    return { cityName: trip.name, countryName: null, currency: DEFAULT_TARGET_CURRENCY }
  }

  return {
    cityName: city.name,
    countryName: COUNTRY_NAME[city.countryCode] ?? null,
    currency: COUNTRY_CURRENCY[city.countryCode] ?? DEFAULT_TARGET_CURRENCY,
  }
}
