import { describe, expect, it } from 'vitest'
import { CITIES_BY_COUNTRY } from '../data/cities'
import type { TripSummary } from '../types/trip-types'
import { getTripDestination } from './city-airport'

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

describe('getTripDestination', () => {
  it('첫 도시와 그 도시의 도착 공항', () => {
    expect(getTripDestination(trip('여행', ['jp-tokyo', 'jp-osaka']))).toEqual({ cityName: '도쿄', airport: 'NRT' })
  })

  it('공항이 없는 도시는 가까운 공항', () => {
    expect(getTripDestination(trip('교토', ['jp-kyoto']))?.airport).toBe('KIX')
    expect(getTripDestination(trip('오타루', ['jp-otaru']))?.airport).toBe('CTS')
  })

  it('도시 코드가 없는 예전 여행은 이름 앞부분으로 찾는다', () => {
    expect(getTripDestination(trip('나하 3박 4일'))).toEqual({ cityName: '나하', airport: 'OKA' })
  })

  it('도시를 못 찾으면 null', () => {
    expect(getTripDestination(trip('어딘가로'))).toBeNull()
  })

  // 도시를 새로 추가하면 공항도 정해야 탑승권에 공항 칸이 비지 않는다
  it.each(Object.values(CITIES_BY_COUNTRY).flat().map((city) => [city.id, city.name]))(
    '%s (%s) 는 도착 공항이 정해져 있다',
    (id) => {
      expect(getTripDestination(trip('', [id]))?.airport).toMatch(/^[A-Z]{3}$/)
    },
  )
})
