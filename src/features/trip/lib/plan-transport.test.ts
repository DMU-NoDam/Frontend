import { describe, expect, it } from 'vitest'
import { datePlan, placePlan, planList, transport } from '../testing/plan-fixtures'
import type { RouteInfo } from '../types/plan-types'
import {
  applyRouteInfoToPlans,
  applyTransportToPlans,
  findPendingTransportLegs,
  pendingLegsSignature,
} from './plan-transport'

const ROUTE: RouteInfo = {
  totalDistanceMeters: 1500,
  totalDurationSeconds: 1200,
  steps: [{ method: 'WALK', path: [{ lat: 35.6, lng: 139.7 }, { lat: 35.61, lng: 139.71 }] }],
}

describe('findPendingTransportLegs', () => {
  it('마지막 일정을 뺀, 이동이 비어 있는 구간', () => {
    const plans = [
      placePlan(1, 10, 100, { fromTransport: transport(91, 1, 2) }),
      placePlan(2, 10, 200),
      placePlan(3, 10, 300),
    ]

    expect(findPendingTransportLegs([datePlan(10, 4, plans)])).toEqual([
      { datePlanId: 10, datePlanVersion: 4, fromPlacePlanId: 2, toPlacePlanId: 3 },
    ])
  })

  it('배열 순서가 아니라 orderIndex 순서로 이웃을 정한다', () => {
    // 순서 : 3 -> 1 -> 2
    const plans = [placePlan(1, 10, 200), placePlan(2, 10, 300), placePlan(3, 10, 100)]

    expect(findPendingTransportLegs([datePlan(10, 0, plans)]).map((leg) => [leg.fromPlacePlanId, leg.toPlacePlanId]))
      .toEqual([[3, 1], [1, 2]])
  })

  it('DatePlan 을 넘어 이어 붙이지 않는다', () => {
    const datePlans = [
      datePlan(10, 0, [placePlan(1, 10, 100)]),
      datePlan(11, 0, [placePlan(2, 11, 100)]),
    ]

    expect(findPendingTransportLegs(datePlans)).toEqual([])
  })

  it('모든 구간이 채워졌으면 빈 목록', () => {
    const plans = [
      placePlan(1, 10, 100, { fromTransport: transport(91, 1, 2) }),
      placePlan(2, 10, 200),
    ]

    expect(findPendingTransportLegs([datePlan(10, 0, plans)])).toEqual([])
  })

  it('일정이 없거나 하나면 구간이 없다', () => {
    expect(findPendingTransportLegs([])).toEqual([])
    expect(findPendingTransportLegs([datePlan(10, 0, [])])).toEqual([])
    expect(findPendingTransportLegs([datePlan(10, 0, [placePlan(1, 10, 100)])])).toEqual([])
  })
})

describe('pendingLegsSignature', () => {
  const leg = { datePlanId: 10, datePlanVersion: 2, fromPlacePlanId: 1, toPlacePlanId: 2 }

  it('같은 구간 묶음이면 같은 지문', () => {
    expect(pendingLegsSignature([leg])).toBe(pendingLegsSignature([{ ...leg }]))
  })

  it('version 이 오르면 다른 지문 (기다린 시간을 새로 센다)', () => {
    expect(pendingLegsSignature([leg])).not.toBe(pendingLegsSignature([{ ...leg, datePlanVersion: 3 }]))
  })

  it('구간이 없으면 빈 문자열', () => {
    expect(pendingLegsSignature([])).toBe('')
  })
})

describe('applyTransportToPlans', () => {
  const plans = () => planList([
    datePlan(10, 2, [placePlan(1, 10, 100), placePlan(2, 10, 200), placePlan(3, 10, 300)]),
    datePlan(11, 0, [placePlan(4, 11, 100)]),
  ])
  const leg = { datePlanId: 10, datePlanVersion: 2, fromPlacePlanId: 1, toPlacePlanId: 2 }

  it('출발 장소의 fromTransport 에 넣는다', () => {
    const result = applyTransportToPlans(plans(), leg, transport(91, 1, 2))

    const updated = result.datePlans[0].plans
    expect(updated[0].fromTransport?.id).toBe(91)
    expect(updated[1].fromTransport).toBeNull()
  })

  it('다른 DatePlan 과 다른 장소는 그대로 (같은 객체)', () => {
    const before = plans()
    const result = applyTransportToPlans(before, leg, transport(91, 1, 2))

    expect(result.datePlans[1]).toBe(before.datePlans[1])
    expect(result.datePlans[0].plans[1]).toBe(before.datePlans[0].plans[1])
  })

  it('원본 캐시를 바꾸지 않는다', () => {
    const before = plans()
    applyTransportToPlans(before, leg, transport(91, 1, 2))

    expect(before.datePlans[0].plans[0].fromTransport).toBeNull()
  })

  it('요청 뒤에 version 이 바뀌었으면 반영하지 않는다 (늦게 온 응답)', () => {
    const before = plans()

    expect(applyTransportToPlans(before, { ...leg, datePlanVersion: 1 }, transport(91, 1, 2))).toBe(before)
  })

  it('지금 순서에서 바로 이웃이 아니면 반영하지 않는다', () => {
    const before = plans()

    expect(applyTransportToPlans(before, leg, transport(91, 1, 3))).toBe(before)
  })

  it('이미 채워진 자리는 덮어쓰지 않는다', () => {
    const before = planList([
      datePlan(10, 2, [placePlan(1, 10, 100, { fromTransport: transport(90, 1, 2) }), placePlan(2, 10, 200)]),
    ])

    expect(applyTransportToPlans(before, leg, transport(91, 1, 2))).toBe(before)
  })

  it('DatePlan 이나 출발 장소가 없으면 그대로', () => {
    const before = plans()

    expect(applyTransportToPlans(before, { ...leg, datePlanId: 99 }, transport(91, 1, 2))).toBe(before)
    expect(applyTransportToPlans(before, leg, transport(91, 77, 2))).toBe(before)
  })
})

describe('applyRouteInfoToPlans', () => {
  it('그 이동 구간의 비어 있는 경로만 채운다', () => {
    const before = planList([
      datePlan(10, 0, [
        placePlan(1, 10, 100, { fromTransport: transport(91, 1, 2) }),
        placePlan(2, 10, 200, { fromTransport: transport(92, 2, 3) }),
        placePlan(3, 10, 300),
      ]),
    ])

    const result = applyRouteInfoToPlans(before, 92, ROUTE)

    expect(result.datePlans[0].plans[1].fromTransport?.routeInfo).toEqual(ROUTE)
    expect(result.datePlans[0].plans[0].fromTransport?.routeInfo).toBeNull()
    expect(before.datePlans[0].plans[1].fromTransport?.routeInfo).toBeNull()
  })

  it('이미 경로가 있으면 바꾸지 않고 원본을 돌려준다', () => {
    const before = planList([
      datePlan(10, 0, [placePlan(1, 10, 100, { fromTransport: transport(91, 1, 2, { routeInfo: ROUTE }) })]),
    ])

    expect(applyRouteInfoToPlans(before, 91, { ...ROUTE, totalDurationSeconds: 1 })).toBe(before)
  })

  it('캐시에 그 이동 구간이 없으면 원본 그대로', () => {
    const before = planList([datePlan(10, 0, [placePlan(1, 10, 100)])])

    expect(applyRouteInfoToPlans(before, 91, ROUTE)).toBe(before)
  })
})
