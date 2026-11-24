import type { DatePlan, PlacePlan, PlanListResponse, Transport } from '../types/plan-types'

// 일정 관련 테스트에서 쓰는 최소 데이터. 테스트에서만 import 한다

export function placePlan(
  id: number,
  datePlanId: number,
  orderIndex: number,
  overrides: Partial<PlacePlan> = {},
): PlacePlan {
  return {
    id,
    datePlanId,
    orderIndex,
    date: '2026-12-01',
    startTime: '09:00:00',
    endTime: '10:00:00',
    placeInfo: {
      id: id * 100,
      regionId: 1,
      placeType: '관광지',
      googleId: `google-${id}`,
      name: `place-${id}`,
      address: 'tokyo',
      priceType: null,
      lon: 139.7,
      lat: 35.6,
    },
    fromTransport: null,
    ...overrides,
  }
}

export function datePlan(id: number, version: number, plans: PlacePlan[]): DatePlan {
  return { id, date: '2026-12-01', theme: 'FOOD', version, plans }
}

export function planList(datePlans: DatePlan[]): PlanListResponse {
  return { message: 'success', datePlans }
}

export function transport(id: number, fromPlacePlanId: number, toPlacePlanId: number,
                          overrides: Partial<Transport> = {}): Transport {
  return {
    id,
    startTime: '10:00:00',
    endTime: '10:20:00',
    takeTime: 1200,
    totalDistanceMeters: 1500,
    fromPlacePlanId,
    toPlacePlanId,
    routeInfo: null,
    ...overrides,
  }
}
