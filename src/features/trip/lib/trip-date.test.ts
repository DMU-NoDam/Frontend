import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TripSummary } from '../types/trip-types'
import {
  formatTripPeriod,
  getDdayLabel,
  getNextFixedTrip,
  getTripStatusLabel,
  getUpcomingFixedTrips,
  getUpcomingTrips,
  isTripActive,
} from './trip-date'

// 오늘 = 2026-11-24 (화) 오후. 날짜 비교는 시각과 상관없이 날짜로만 해야 한다
const TODAY = new Date(2026, 10, 24, 15, 30)

function trip(id: string, startDate: string, endDate: string, fixed = true): TripSummary {
  return {
    id,
    name: `여행 ${id}`,
    personCount: 2,
    scheduleType: 'NORMAL',
    tripThemeType: null,
    priceType: 'NORMAL',
    startDate,
    endDate,
    fixed,
    regionCodes: [],
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(TODAY)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getDdayLabel', () => {
  it('오늘 출발이면 D-Day', () => {
    expect(getDdayLabel('2026-11-24')).toBe('D-Day')
  })

  it('앞으로 남은 날은 D-N', () => {
    expect(getDdayLabel('2026-11-25')).toBe('D-1')
    expect(getDdayLabel('2026-12-24')).toBe('D-30')
  })

  it('지난 날은 D+N', () => {
    expect(getDdayLabel('2026-11-23')).toBe('D+1')
    expect(getDdayLabel('2026-11-14')).toBe('D+10')
  })

  it('해를 넘겨도 날짜 차이로 센다', () => {
    expect(getDdayLabel('2027-01-01')).toBe('D-38')
  })
})

describe('isTripActive', () => {
  it('출발일 ~ 도착일 사이면 여행 중 (양 끝 포함)', () => {
    expect(isTripActive('2026-11-22', '2026-11-26')).toBe(true)
    expect(isTripActive('2026-11-24', '2026-11-26')).toBe(true)
    expect(isTripActive('2026-11-20', '2026-11-24')).toBe(true)
    expect(isTripActive('2026-11-24', '2026-11-24')).toBe(true)
  })

  it('아직 출발 전이거나 이미 끝났으면 아니다', () => {
    expect(isTripActive('2026-11-25', '2026-11-27')).toBe(false)
    expect(isTripActive('2026-11-20', '2026-11-23')).toBe(false)
  })
})

describe('getUpcomingFixedTrips', () => {
  it('확정되고 아직 끝나지 않은 여행만, 출발일이 가까운 순', () => {
    const trips = [
      trip('late', '2026-12-20', '2026-12-22'),
      trip('ended', '2026-11-01', '2026-11-03'),
      trip('draft', '2026-11-30', '2026-12-01', false),
      trip('soon', '2026-11-28', '2026-11-30'),
      trip('now', '2026-11-23', '2026-11-25'),
    ]

    expect(getUpcomingFixedTrips(trips).map((t) => t.id)).toEqual(['now', 'soon', 'late'])
  })

  it('오늘 끝나는 여행은 아직 다가오는 여행이다', () => {
    expect(getUpcomingFixedTrips([trip('today', '2026-11-22', '2026-11-24')])).toHaveLength(1)
  })

  it('원본 배열 순서를 바꾸지 않는다', () => {
    const trips = [trip('b', '2026-12-10', '2026-12-11'), trip('a', '2026-12-01', '2026-12-02')]

    getUpcomingFixedTrips(trips)

    expect(trips.map((t) => t.id)).toEqual(['b', 'a'])
  })
})

describe('getNextFixedTrip', () => {
  it('가장 가까운 확정 여행', () => {
    const trips = [trip('b', '2026-12-10', '2026-12-11'), trip('a', '2026-12-01', '2026-12-02')]

    expect(getNextFixedTrip(trips)?.id).toBe('a')
  })

  it('확정 여행이 없으면 undefined', () => {
    expect(getNextFixedTrip([trip('draft', '2026-12-01', '2026-12-02', false)])).toBeUndefined()
    expect(getNextFixedTrip([])).toBeUndefined()
  })
})

describe('getUpcomingTrips', () => {
  it('확정 여부와 상관없이 아직 끝나지 않은 여행, 출발일 순', () => {
    const trips = [
      trip('fixed', '2026-12-05', '2026-12-07'),
      trip('draft', '2026-12-01', '2026-12-02', false),
      trip('ended', '2026-10-01', '2026-10-03', false),
    ]

    expect(getUpcomingTrips(trips).map((t) => t.id)).toEqual(['draft', 'fixed'])
  })
})

describe('formatTripPeriod', () => {
  it('월/일–월/일, 앞자리 0 없이', () => {
    expect(formatTripPeriod('2026-11-02', '2026-11-04')).toBe('11/2–11/4')
    expect(formatTripPeriod('2026-01-09', '2026-01-10')).toBe('1/9–1/10')
  })

  it('달과 해를 넘어가도 그대로', () => {
    expect(formatTripPeriod('2026-12-30', '2027-01-02')).toBe('12/30–1/2')
  })
})

describe('getTripStatusLabel', () => {
  it('여행 중이면 여행 중', () => {
    expect(getTripStatusLabel(trip('now', '2026-11-23', '2026-11-25'))).toBe('여행 중')
  })

  it('아니면 출발일 기준 D-day', () => {
    expect(getTripStatusLabel(trip('soon', '2026-11-27', '2026-11-29'))).toBe('D-3')
    expect(getTripStatusLabel(trip('ended', '2026-11-20', '2026-11-22'))).toBe('D+4')
  })
})
