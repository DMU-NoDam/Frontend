import { describe, expect, it } from 'vitest'
import { datePlan, placePlan, transport } from '../testing/plan-fixtures'
import type { DatePlan, RawDatePlan, RawPlacePlan, RawTransport, TripThemeType } from '../types/plan-types'
import {
  groupPlansByTheme,
  mapDatePlan,
  mapPlacePlanTransport,
  mapPlanListResponse,
  mapPlanListToThemeCards,
  mapRecommendedPlaceItems,
  mapTimeObject,
  mapTransport,
} from './plan-mapper'

const PLACE_INFO = placePlan(1, 10, 100).placeInfo

function rawTransport(id: number, from: number, to: number, withRoute = true): RawTransport {
  return {
    id,
    startTime: '10:00:00',
    endTime: '10:20:00',
    takeTime: 1200,
    totalDistanceMeters: 1500,
    fromPlacePlanId: from,
    toPlacePlanId: to,
    transportPlanId: id,
    routeInfo: withRoute
      ? {
          totalDistanceMeters: 1500,
          totalDurationSeconds: 1200,
          steps: [{
            start: { coordinate: { lat: 1, lng: 1 }, name: '출발' },
            end: { coordinate: { lat: 4, lng: 4 }, name: '도착' },
            methodType: 'TRAIN',
            polygon: [
              { coordinate: { lat: 2, lng: 2 }, name: '' },
              { coordinate: { lat: 3, lng: 3 }, name: '' },
            ],
          }],
        }
      : null,
  }
}

function rawPlacePlan(id: number, orderIndex: number, fromTransport: RawTransport | null = null): RawPlacePlan {
  return {
    id,
    orderIndex,
    date: '2026-12-01',
    startTime: '09:00:00',
    endTime: '10:00:00',
    placeInfo: PLACE_INFO,
    fromTransport,
  }
}

function rawDatePlan(id: number, date: string, theme: TripThemeType, placePlanInfos: RawPlacePlan[] = []): RawDatePlan {
  return { id, date, datePlanTheme: theme, version: 1, placePlanInfos }
}

function themedDatePlan(id: number, date: string, theme: TripThemeType, plans = [placePlan(id * 10, id, 100)]): DatePlan {
  return { ...datePlan(id, 0, plans), date, theme }
}

describe('mapTransport', () => {
  it('경로 한 구간을 [출발, ...경유, 도착] 좌표 배열로 펼친다', () => {
    const transportInfo = mapTransport(rawTransport(91, 1, 2))

    expect(transportInfo.routeInfo?.steps).toEqual([{
      method: 'TRAIN',
      path: [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }, { lat: 3, lng: 3 }, { lat: 4, lng: 4 }],
    }])
    expect(transportInfo).toMatchObject({ id: 91, takeTime: 1200, fromPlacePlanId: 1, toPlacePlanId: 2 })
  })

  it('경로가 아직 없으면 routeInfo null', () => {
    expect(mapTransport(rawTransport(91, 1, 2, false)).routeInfo).toBeNull()
  })
})

describe('mapPlacePlanTransport', () => {
  it('앞뒤 이동을 각각 매핑하고 없으면 null', () => {
    const result = mapPlacePlanTransport({
      placePlanId: 2,
      previousTransport: rawTransport(91, 1, 2),
      nextTransport: null,
    })

    expect(result.placePlanId).toBe(2)
    expect(result.previousTransport?.id).toBe(91)
    expect(result.nextTransport).toBeNull()
  })
})

describe('mapDatePlan', () => {
  it('테마 필드 이름을 바꾸고 각 장소에 소속 DatePlan id 를 넣는다', () => {
    const result = mapDatePlan(rawDatePlan(10, '2026-12-01', 'HEALING', [
      rawPlacePlan(1, 100, rawTransport(91, 1, 2)),
      rawPlacePlan(2, 200),
    ]))

    expect(result).toMatchObject({ id: 10, theme: 'HEALING', version: 1 })
    expect(result.plans.map((p) => p.datePlanId)).toEqual([10, 10])
    expect(result.plans[0].fromTransport?.id).toBe(91)
    expect(result.plans[1].fromTransport).toBeNull()
  })

  it('장소 순서는 응답 그대로 둔다 (정렬은 화면에서)', () => {
    const result = mapDatePlan(rawDatePlan(10, '2026-12-01', 'FOOD', [rawPlacePlan(2, 200), rawPlacePlan(1, 100)]))

    expect(result.plans.map((p) => p.id)).toEqual([2, 1])
  })
})

describe('mapPlanListResponse', () => {
  it('DatePlan 을 날짜순으로', () => {
    const raw = {
      message: 'success',
      body: [
        rawDatePlan(12, '2026-12-03', 'FOOD'),
        rawDatePlan(10, '2026-12-01', 'FOOD'),
        rawDatePlan(11, '2026-12-02', 'FOOD'),
      ],
    }

    expect(mapPlanListResponse(raw).datePlans.map((d) => d.id)).toEqual([10, 11, 12])
  })

  it('응답 배열을 바꾸지 않는다', () => {
    const body = [rawDatePlan(12, '2026-12-03', 'FOOD'), rawDatePlan(10, '2026-12-01', 'FOOD')]

    mapPlanListResponse({ message: 'success', body })

    expect(body.map((d) => d.id)).toEqual([12, 10])
  })
})

describe('groupPlansByTheme', () => {
  it('같은 테마의 날짜들을 날짜순으로 이어 붙인다', () => {
    const body = groupPlansByTheme([
      themedDatePlan(2, '2026-12-02', 'FOOD'),
      themedDatePlan(3, '2026-12-01', 'HEALING'),
      themedDatePlan(1, '2026-12-01', 'FOOD'),
    ])

    expect(body.FOOD?.map((p) => p.datePlanId)).toEqual([1, 2])
    expect(body.HEALING?.map((p) => p.datePlanId)).toEqual([3])
    expect(body.LANDMARK).toBeUndefined()
  })
})

describe('mapTimeObject', () => {
  it('HH:mm:ss 로 두 자리씩 채운다', () => {
    expect(mapTimeObject({ hour: 9, minute: 5, second: 0, nano: 0 })).toBe('09:05:00')
    expect(mapTimeObject({ hour: 23, minute: 59, second: 59, nano: 999 })).toBe('23:59:59')
  })
})

describe('mapRecommendedPlaceItems', () => {
  it('시간 객체를 문자열로 바꾸고 나머지는 그대로', () => {
    const [item] = mapRecommendedPlaceItems([{
      place: PLACE_INFO,
      travelDurationSeconds: 600,
      travelDistanceMeters: 800,
      startTime: { hour: 12, minute: 0, second: 0, nano: 0 },
      endTime: { hour: 13, minute: 30, second: 0, nano: 0 },
    }])

    expect(item).toEqual({
      place: PLACE_INFO,
      travelDurationSeconds: 600,
      travelDistanceMeters: 800,
      startTime: '12:00:00',
      endTime: '13:30:00',
    })
  })
})

describe('mapPlanListToThemeCards', () => {
  it('일정이 있는 테마만 정해진 순서(FOOD → HEALING → LANDMARK → ACTIVITY)로', () => {
    const cards = mapPlanListToThemeCards([
      themedDatePlan(1, '2026-12-01', 'LANDMARK'),
      themedDatePlan(2, '2026-12-01', 'FOOD'),
      themedDatePlan(3, '2026-12-01', 'HEALING', []),
    ])

    expect(cards.map((card) => card.theme)).toEqual(['FOOD', 'LANDMARK'])
  })

  it('일수 · 박수 · 일정 수를 센다', () => {
    const [card] = mapPlanListToThemeCards([
      themedDatePlan(1, '2026-12-01', 'FOOD', [placePlan(11, 1, 100, { date: '2026-12-01' }), placePlan(12, 1, 200, { date: '2026-12-01' })]),
      themedDatePlan(2, '2026-12-02', 'FOOD', [placePlan(21, 2, 100, { date: '2026-12-02' })]),
      themedDatePlan(3, '2026-12-03', 'FOOD', [placePlan(31, 3, 100, { date: '2026-12-03' })]),
    ])

    expect(card).toMatchObject({ dayCount: 3, nightCount: 2, scheduleCount: 4, title: '미식 집중 코스' })
  })

  it('당일치기는 0박', () => {
    const [card] = mapPlanListToThemeCards([themedDatePlan(1, '2026-12-01', 'FOOD')])

    expect(card.nightCount).toBe(0)
  })

  it('이동 시간(분, 반올림)과 거리를 모두 더하고, 비어 있는 이동은 빼고 센다', () => {
    const [card] = mapPlanListToThemeCards([themedDatePlan(1, '2026-12-01', 'FOOD', [
      placePlan(11, 1, 100, { fromTransport: transport(91, 11, 12, { takeTime: 600, totalDistanceMeters: 1000 }) }),
      placePlan(12, 1, 200, { fromTransport: transport(92, 12, 13, { takeTime: 330, totalDistanceMeters: 250 }) }),
      placePlan(13, 1, 300),
    ])])

    expect(card.totalMoveMinutes).toBe(16) // 930초 = 15.5분 -> 16
    expect(card.totalDistanceMeters).toBe(1250)
  })

  it('일정이 하나도 없으면 빈 목록', () => {
    expect(mapPlanListToThemeCards([])).toEqual([])
  })
})
