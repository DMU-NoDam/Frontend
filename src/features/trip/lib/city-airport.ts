import { CITIES_BY_COUNTRY } from '../data/cities'
import type { TripSummary } from '../types/trip-types'

// 여행 카드 탑승권에 적는 도착 공항 (도시 코드 → 그 도시로 갈 때 주로 내리는 공항의 IATA 코드)
// 공항이 없는 도시는 가까운 공항으로 적는다 (예: 교토 → 간사이공항 KIX)
const AIRPORT_BY_CITY: Record<string, string> = {
  // 관동
  'jp-tokyo': 'NRT',
  'jp-yokohama': 'HND',
  'jp-kamakura': 'HND',
  'jp-nikko': 'NRT',
  'jp-hakone': 'HND',
  'jp-chiba': 'NRT',
  'jp-saitama': 'HND',
  // 관서
  'jp-osaka': 'KIX',
  'jp-kyoto': 'KIX',
  'jp-kobe': 'UKB',
  'jp-nara': 'KIX',
  'jp-himeji': 'KIX',
  'jp-wakayama': 'KIX',
  // 규슈
  'jp-fukuoka': 'FUK',
  'jp-nagasaki': 'NGS',
  'jp-kumamoto': 'KMJ',
  'jp-beppu': 'OIT',
  'jp-yufuin': 'OIT',
  'jp-kagoshima': 'KOJ',
  // 중부
  'jp-nagoya': 'NGO',
  'jp-kanazawa': 'KMQ',
  'jp-takayama': 'NGO',
  'jp-shirakawago': 'NGO',
  'jp-shizuoka': 'FSZ',
  // 홋카이도
  'jp-sapporo': 'CTS',
  'jp-otaru': 'CTS',
  'jp-hakodate': 'HKD',
  'jp-furano': 'AKJ',
  'jp-asahikawa': 'AKJ',
  // 주고쿠
  'jp-hiroshima': 'HIJ',
  'jp-miyajima': 'HIJ',
  'jp-okayama': 'OKJ',
  'jp-kurashiki': 'OKJ',
  // 시코쿠
  'jp-takamatsu': 'TAK',
  'jp-matsuyama': 'MYJ',
  'jp-kochi': 'KCZ',
  'jp-tokushima': 'TKS',
  // 오키나와
  'jp-naha': 'OKA',
  'jp-ishigaki': 'ISG',
  'jp-miyakojima': 'MMY',
}

const ALL_CITIES = Object.values(CITIES_BY_COUNTRY).flat()

export type TripDestination = {
  cityName: string
  // 공항을 모르는 도시면 null
  airport: string | null
}

// 여행의 첫 도시와 도착 공항. 도시 코드가 없는 예전 여행은 여행 이름 앞부분으로 찾고, 못 찾으면 null
export function getTripDestination(trip: TripSummary): TripDestination | null {
  const city =
    ALL_CITIES.find((c) => c.id === trip.regionCodes[0]) ??
    ALL_CITIES.filter((c) => trip.name.startsWith(c.name)).sort((a, b) => b.name.length - a.name.length)[0]
  if (!city) return null
  return { cityName: city.name, airport: AIRPORT_BY_CITY[city.id] ?? null }
}
