import { CITIES_BY_COUNTRY } from '../data/cities'
import type { TripSummary } from '../types/trip-types'

// 여행 카드 배경 사진: src/assets/city/<도시 코드>.jpg (예: jp-osaka.jpg)
// 파일을 추가하기만 하면 그 도시 카드에 바로 쓰인다. 사진이 없는 도시는 기존 그라데이션
const photoModules = import.meta.glob<string>('../../../assets/city/*.jpg', {
  eager: true,
  import: 'default',
})

const PHOTO_BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(photoModules).map(([path, url]) => [path.split('/').pop()!.replace(/\.jpg$/, ''), url]),
)

const ALL_CITIES = Object.values(CITIES_BY_COUNTRY).flat()

// 여행의 도시 코드 중 사진이 있는 첫 도시. 도시 코드가 없는 예전 여행은 여행 이름 앞부분으로 찾는다
export function getCityPhoto(trip: TripSummary): string | undefined {
  for (const code of trip.regionCodes) {
    if (PHOTO_BY_CODE[code]) return PHOTO_BY_CODE[code]
  }
  if (trip.regionCodes.length > 0) return undefined

  const city = ALL_CITIES
    .filter((c) => trip.name.startsWith(c.name))
    .sort((a, b) => b.name.length - a.name.length)[0]
  return city ? PHOTO_BY_CODE[city.id] : undefined
}
