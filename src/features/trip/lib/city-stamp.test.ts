import { describe, expect, it } from 'vitest'
import type { TripSummary } from '../types/trip-types'
import { getTripStamp } from './city-stamp'

function trip(name: string, regionCodes: string[] = []): TripSummary {
  return {
    id: '1',
    name,
    personCount: 2,
    scheduleType: 'NORMAL',
    tripThemeType: null,
    priceType: 'NORMAL',
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    fixed: true,
    regionCodes,
  }
}

describe('getTripStamp', () => {
  it('도장 그림이 있는 도시는 그림 + 영문 도시 이름', () => {
    const stamp = getTripStamp(trip('교토 여행', ['jp-kyoto']))

    expect(stamp.image).toMatch(/jp-kyoto\.png$/)
    expect(stamp.label).toBe('KYOTO')
  })

  it('도장 그림이 없는 도시는 글자 도장 (영문 이름만)', () => {
    expect(getTripStamp(trip('히로시마', ['jp-hiroshima']))).toEqual({ image: undefined, label: 'HIROSHIMA' })
  })

  it('여러 도시면 첫 도시 도장', () => {
    expect(getTripStamp(trip('간사이', ['jp-osaka', 'jp-kyoto'])).label).toBe('OSAKA')
  })

  it('도시 코드가 없는 예전 여행은 이름 앞부분으로 찾는다', () => {
    const stamp = getTripStamp(trip('도쿄와 요코하마'))

    expect(stamp.image).toMatch(/jp-tokyo\.png$/)
    expect(stamp.label).toBe('TOKYO')
  })

  it('나라 접두사(jp-)만 떼고 대문자로', () => {
    expect(getTripStamp(trip('시라카와고', ['jp-shirakawago'])).label).toBe('SHIRAKAWAGO')
  })

  it('도시를 못 찾으면 여행 이름을 그대로 글자 도장에', () => {
    expect(getTripStamp(trip('졸업 여행'))).toEqual({ image: undefined, label: '졸업 여행' })
  })
})
