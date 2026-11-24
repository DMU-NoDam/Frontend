import { describe, expect, it } from 'vitest'
import type { FlightInfo, TripCreateFormValues, TripSummaryApiItem } from '../types/trip-types'
import { buildTripName, mapFormToRequest } from './trip-mapper'
import { mapTripSummary } from './trip-summary-mapper'

const OUTBOUND: FlightInfo = {
  flightIata: 'KE703',
  departureAirport: 'ICN',
  arrivalAirport: 'NRT',
  departureTime: '2026-12-01 09:00',
  arrivalTime: '2026-12-01 11:20',
}

const INBOUND: FlightInfo = {
  flightIata: 'KE704',
  departureAirport: 'NRT',
  arrivalAirport: 'ICN',
  departureTime: '2026-12-03 18:40',
  arrivalTime: '2026-12-03 21:10',
}

function form(overrides: Partial<TripCreateFormValues> = {}): TripCreateFormValues {
  return {
    uuid: '00000000-0000-0000-0000-000000000000',
    country: 'JP',
    region: ['jp-tokyo'],
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    personCount: 2,
    hotel: [],
    selectedPlace: [],
    ...overrides,
  }
}

describe('buildTripName', () => {
  it('도시 하나면 그 도시 이름', () => {
    expect(buildTripName(['jp-tokyo'], 'JP')).toBe('도쿄')
  })

  it('도시 둘이면 "A과 B"', () => {
    expect(buildTripName(['jp-osaka', 'jp-kyoto'], 'JP')).toBe('오사카과 교토')
  })

  it('모르는 도시 코드는 코드를 그대로', () => {
    expect(buildTripName(['jp-atlantis'], 'JP')).toBe('jp-atlantis')
  })
})

describe('mapFormToRequest', () => {
  it('필수 정보만 있으면 여행 정보와 기본값(NORMAL)으로 요청을 만든다', () => {
    expect(mapFormToRequest(form())).toEqual({
      trip: {
        name: '도쿄',
        uuid: '00000000-0000-0000-0000-000000000000',
        personCount: 2,
        scheduleType: 'NORMAL',
        priceType: 'NORMAL',
        startDate: '2026-12-01',
        endDate: '2026-12-03',
      },
      region: ['jp-tokyo'],
      selectedPlace: [],
      departFlight: undefined,
      arriveFlight: undefined,
    })
  })

  it('고른 일정 밀도 · 가격대를 그대로 보낸다', () => {
    const request = mapFormToRequest(form({ scheduleType: 'TIGHT', priceType: 'LUXURY' }))

    expect(request.trip.scheduleType).toBe('TIGHT')
    expect(request.trip.priceType).toBe('LUXURY')
  })

  it('가고 싶은 장소는 google id 목록으로', () => {
    const request = mapFormToRequest(form({
      selectedPlace: [{ id: 'g-1', name: '센소지' }, { id: 'g-2', name: '시부야 스카이' }],
    }))

    expect(request.selectedPlace).toEqual(['g-1', 'g-2'])
  })

  it('숙소는 첫 번째 것만 보낸다', () => {
    const request = mapFormToRequest(form({
      hotel: [{ id: 'h-1', name: '호텔 A' }, { id: 'h-2', name: '호텔 B' }],
    }))

    expect(request.hotel).toBe('h-1')
  })

  it('숙소를 고르지 않으면 hotel 키가 없다', () => {
    expect(mapFormToRequest(form())).not.toHaveProperty('hotel')
  })

  // 현재 매핑 : 가는 편(departFlight)은 일본 쪽 도착 공항 · 시간, 오는 편(arriveFlight)은 일본 쪽 출발 공항 · 시간
  it('항공편은 일본 쪽 공항과 그 시각만 보낸다', () => {
    const request = mapFormToRequest(form({ departFlight: OUTBOUND, arriveFlight: INBOUND }))

    expect(request.departFlight).toEqual({ airport: 'NRT', time: '2026-12-01 11:20' })
    expect(request.arriveFlight).toEqual({ airport: 'NRT', time: '2026-12-03 18:40' })
  })

  it('한쪽 항공편만 있으면 그쪽만', () => {
    const request = mapFormToRequest(form({ departFlight: OUTBOUND }))

    expect(request.departFlight).toBeDefined()
    expect(request.arriveFlight).toBeUndefined()
  })
})

describe('mapTripSummary', () => {
  const item: TripSummaryApiItem = {
    id: 42,
    name: '도쿄',
    personCount: 2,
    scheduleType: 'NORMAL',
    tripThemeType: 'FOOD',
    priceType: 'NORMAL',
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    fixed: true,
    regionCodes: ['jp-tokyo'],
  }

  it('id 는 문자열로 바꾸고 나머지는 그대로', () => {
    expect(mapTripSummary(item)).toEqual({ ...item, id: '42' })
  })

  it('regionCodes 가 없는 예전 응답은 빈 배열', () => {
    expect(mapTripSummary({ ...item, regionCodes: undefined }).regionCodes).toEqual([])
  })
})
