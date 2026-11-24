import { describe, expect, it } from 'vitest'
import type { TripSummary } from '@/features/trip/types/trip-types'
import { getTripLocation } from './trip-location'

function trip(name: string, regionCodes: string[] = []): TripSummary {
  return {
    id: '1',
    name,
    personCount: 2,
    scheduleType: 'NORMAL',
    tripThemeType: null,
    priceType: 'NORMAL',
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    fixed: true,
    regionCodes,
  }
}

describe('getTripLocation', () => {
  it('첫 번째 도시 코드로 도시 · 나라 · 통화를 찾는다', () => {
    expect(getTripLocation(trip('친구랑 여행', ['jp-osaka', 'jp-kyoto']))).toEqual({
      cityName: '오사카',
      countryName: '일본',
      currency: 'JPY',
    })
  })

  it('도시 코드가 이름보다 우선한다', () => {
    expect(getTripLocation(trip('도쿄 여행', ['jp-fukuoka'])).cityName).toBe('후쿠오카')
  })

  it('도시 코드가 없는 예전 여행은 이름 앞부분으로 찾는다', () => {
    expect(getTripLocation(trip('교토')).cityName).toBe('교토')
    expect(getTripLocation(trip('삿포로과 오타루')).cityName).toBe('삿포로')
  })

  it('모르는 도시 코드면 이름으로 다시 찾는다', () => {
    expect(getTripLocation(trip('나고야 출장', ['kr-seoul'])).cityName).toBe('나고야')
  })

  it('도시를 못 찾으면 이름을 그대로 쓰고 통화는 엔화', () => {
    expect(getTripLocation(trip('우리끼리 여행'))).toEqual({
      cityName: '우리끼리 여행',
      countryName: null,
      currency: 'JPY',
    })
  })

  it('이름 중간에 도시가 있어도 앞부분이 아니면 찾지 않는다', () => {
    expect(getTripLocation(trip('겨울 삿포로')).countryName).toBeNull()
  })
})
