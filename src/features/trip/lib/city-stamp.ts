import { CITIES_BY_COUNTRY } from '../data/cities'
import type { TripSummary } from '../types/trip-types'

// 다녀온 여행 여권에 찍는 도시 도장 그림: src/assets/city-stamp/<도시 코드>.png (예: jp-kyoto.png)
// 파일을 추가하기만 하면 그 도시 도장으로 바로 쓰인다. 그림이 없는 도시는 글자 도장
const stampModules = import.meta.glob<string>('../../../assets/city-stamp/*.png', {
  eager: true,
  import: 'default',
})

const STAMP_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(stampModules).map(([path, url]) => [path.split('/').pop()!.replace(/\.png$/, ''), url]),
)

const ALL_CITIES = Object.values(CITIES_BY_COUNTRY).flat()

export type TripStamp = {
  // 도장 그림 (없으면 글자 도장)
  image: string | undefined
  // 글자 도장에 쓰는 영문 도시 이름 ('jp-hiroshima' → 'HIROSHIMA'). 도시를 못 찾으면 여행 이름
  label: string
}

// 여행의 첫 도시 도장. 도시 코드가 없는 예전 여행은 여행 이름 앞부분으로 도시를 찾는다
export function getTripStamp(trip: TripSummary): TripStamp {
  const city =
    ALL_CITIES.find((c) => c.id === trip.regionCodes[0]) ??
    ALL_CITIES.filter((c) => trip.name.startsWith(c.name)).sort((a, b) => b.name.length - a.name.length)[0]
  if (!city) return { image: undefined, label: trip.name }
  return { image: STAMP_BY_CODE[city.id], label: city.id.replace(/^[a-z]+-/, '').toUpperCase() }
}
