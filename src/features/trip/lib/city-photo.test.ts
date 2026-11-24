import { describe, expect, it } from 'vitest'
import type { TripSummary } from '../types/trip-types'
import { getCityPhoto } from './city-photo'

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

describe('getCityPhoto', () => {
  it('사진이 있는 도시 코드면 그 사진', () => {
    expect(getCityPhoto(trip('여행', ['jp-osaka']))).toMatch(/jp-osaka\.jpg$/)
  })

  it('첫 도시에 사진이 없으면 사진이 있는 다음 도시', () => {
    expect(getCityPhoto(trip('여행', ['jp-nara', 'jp-kyoto']))).toMatch(/jp-kyoto\.jpg$/)
  })

  it('도시 코드가 있는데 모두 사진이 없으면 이름으로 찾지 않는다', () => {
    // 이름은 사진이 있는 도쿄로 시작하지만, 코드가 있는 여행은 코드만 본다
    expect(getCityPhoto(trip('도쿄 근교', ['jp-hakone']))).toBeUndefined()
  })

  it('도시 코드가 없는 예전 여행은 이름 앞부분으로 찾는다', () => {
    expect(getCityPhoto(trip('후쿠오카 맛집 투어'))).toMatch(/jp-fukuoka\.jpg$/)
  })

  it('이름으로 찾은 도시에 사진이 없으면 undefined', () => {
    expect(getCityPhoto(trip('나라 사슴공원'))).toBeUndefined()
  })

  it('도시를 못 찾으면 undefined (그라데이션 배경)', () => {
    expect(getCityPhoto(trip('어딘가'))).toBeUndefined()
  })
})
