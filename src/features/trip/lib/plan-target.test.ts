import { describe, expect, it } from 'vitest'
import type { DatePlan, PlacePlan } from '../types/plan-types'
import { sortPlansByOrder } from './plan-order'
import { findEditTarget, findInsertPositionAfter } from './plan-target'

function placePlan(id: number, datePlanId: number, orderIndex: number, startTime = '09:00:00'): PlacePlan {
  return {
    id,
    datePlanId,
    orderIndex,
    date: '2026-12-01',
    startTime,
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
  }
}

function datePlan(id: number, version: number, plans: PlacePlan[]): DatePlan {
  return { id, date: '2026-12-01', theme: 'FOOD', version, plans }
}

describe('sortPlansByOrder', () => {
  it('startTime 이 아니라 orderIndex 순서', () => {
    // 순서를 바꾼 직후 : startTime 은 아직 옛 순서
    const plans = [
      placePlan(1, 10, 300, '09:00:00'),
      placePlan(2, 10, 100, '12:00:00'),
      placePlan(3, 10, 200, '15:00:00'),
    ]

    expect(sortPlansByOrder(plans).map((p) => p.id)).toEqual([2, 3, 1])
  })

  it('원본 배열을 바꾸지 않는다', () => {
    const plans = [placePlan(1, 10, 2), placePlan(2, 10, 1)]

    sortPlansByOrder(plans)

    expect(plans.map((p) => p.id)).toEqual([1, 2])
  })

  it('빈 배열은 빈 배열', () => {
    expect(sortPlansByOrder([])).toEqual([])
  })
})

describe('findEditTarget', () => {
  const datePlans = [datePlan(10, 3, []), datePlan(11, 0, [])]

  it('DatePlan id 와 내가 마지막으로 읽은 version', () => {
    expect(findEditTarget(datePlans, 10)).toEqual({ datePlanId: 10, version: 3 })
  })

  it('편집 이력이 없으면 version 0', () => {
    expect(findEditTarget(datePlans, 11)).toEqual({ datePlanId: 11, version: 0 })
  })

  it('캐시에 없거나 아직 안 읽었으면 null (편집을 시작하지 않는다)', () => {
    expect(findEditTarget(datePlans, 99)).toBeNull()
    expect(findEditTarget(undefined, 10)).toBeNull()
  })
})

describe('findInsertPositionAfter', () => {
  // orderIndex 순서 : 2 -> 1 -> 3 (배열 순서와 다르다)
  const plans = [placePlan(1, 10, 200), placePlan(2, 10, 100), placePlan(3, 10, 300)]
  const datePlans = [datePlan(10, 1, plans)]

  it('기준 장소 바로 뒤 (next 는 orderIndex 순서로 다음 장소)', () => {
    expect(findInsertPositionAfter(datePlans, plans[1])).toEqual({ previousPlacePlanId: 2, nextPlacePlanId: 1 })
    expect(findInsertPositionAfter(datePlans, plans[0])).toEqual({ previousPlacePlanId: 1, nextPlacePlanId: 3 })
  })

  it('마지막 장소 뒤면 next 는 null (맨 뒤)', () => {
    expect(findInsertPositionAfter(datePlans, plans[2])).toEqual({ previousPlacePlanId: 3, nextPlacePlanId: null })
  })

  it('previous 는 항상 채운다 (앞뒤 모두 null 은 만들지 않는다)', () => {
    for (const plan of plans)
      expect(findInsertPositionAfter(datePlans, plan)?.previousPlacePlanId).toBe(plan.id)
  })

  it('소속 DatePlan 을 못 찾으면 null', () => {
    expect(findInsertPositionAfter(datePlans, placePlan(4, 99, 100))).toBeNull()
    expect(findInsertPositionAfter(undefined, plans[0])).toBeNull()
  })

  it('DatePlan 에 이미 없는 장소면 null (다른 사람이 지운 경우)', () => {
    expect(findInsertPositionAfter(datePlans, placePlan(4, 10, 400))).toBeNull()
  })
})
