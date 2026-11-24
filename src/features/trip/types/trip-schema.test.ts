import { describe, expect, it } from 'vitest'
import { tripFormSchema } from './trip-schema'

const VALID = {
  uuid: '00000000-0000-0000-0000-000000000000',
  country: 'JP',
  region: ['jp-tokyo'],
  startDate: '2026-12-01',
  endDate: '2026-12-03',
  personCount: 2,
  hotel: [],
  selectedPlace: [],
}

// 실패하면 그 필드의 첫 오류 문구를 돌려준다
function errorOf(values: unknown, field: string): string | undefined {
  const result = tripFormSchema.safeParse(values)
  if (result.success) return undefined
  return result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe('tripFormSchema', () => {
  it('필수 정보만 있으면 통과', () => {
    expect(tripFormSchema.safeParse(VALID).success).toBe(true)
  })

  it('선택 항목(일정 밀도 · 가격대 · 숙소 · 항공편 · 장소)을 채워도 통과', () => {
    const result = tripFormSchema.safeParse({
      ...VALID,
      scheduleType: 'LOOSE',
      priceType: 'CHEEP',
      hotel: [{ id: 'h-1', name: '호텔', location: { lat: 35.6, lng: 139.7 } }],
      departFlight: {
        flightIata: 'KE703',
        departureAirport: 'ICN',
        arrivalAirport: 'NRT',
        departureTime: '2026-12-01 09:00',
        arrivalTime: '2026-12-01 11:20',
      },
      selectedPlace: [{ id: 'g-1', name: '센소지' }],
    })

    expect(result.success).toBe(true)
  })

  describe('도시', () => {
    it('하나도 안 고르면 안내', () => {
      expect(errorOf({ ...VALID, region: [] }, 'region')).toBe('도시를 1개 이상 선택해 주세요')
    })

    it('두 개까지 고를 수 있다', () => {
      expect(errorOf({ ...VALID, region: ['jp-osaka', 'jp-kyoto'] }, 'region')).toBeUndefined()
    })

    it('세 개부터는 안내', () => {
      expect(errorOf({ ...VALID, region: ['jp-osaka', 'jp-kyoto', 'jp-nara'] }, 'region'))
        .toBe('도시는 최대 2개까지 선택할 수 있어요')
    })
  })

  describe('인원', () => {
    it.each([1, 6])('%i명은 통과', (personCount) => {
      expect(errorOf({ ...VALID, personCount }, 'personCount')).toBeUndefined()
    })

    it('0명이면 안내', () => {
      expect(errorOf({ ...VALID, personCount: 0 }, 'personCount')).toBe('인원은 1명 이상이어야 해요')
    })

    it('7명부터는 안내', () => {
      expect(errorOf({ ...VALID, personCount: 7 }, 'personCount')).toBe('인원은 최대 6명이에요')
    })
  })

  describe('날짜', () => {
    it('출발일이 비면 안내', () => {
      expect(errorOf({ ...VALID, startDate: '' }, 'startDate')).toBe('출발일을 선택해 주세요')
    })

    it('귀국일이 비면 안내', () => {
      expect(errorOf({ ...VALID, endDate: '' }, 'endDate')).toBe('귀국일을 선택해 주세요')
    })

    it('당일치기(출발일 = 귀국일)는 통과', () => {
      expect(tripFormSchema.safeParse({ ...VALID, endDate: '2026-12-01' }).success).toBe(true)
    })

    it('귀국일이 출발일보다 앞이면 귀국일 칸에 안내', () => {
      expect(errorOf({ ...VALID, endDate: '2026-11-30' }, 'endDate')).toBe('귀국일은 출발일 이후여야 해요')
    })
  })

  describe('그 밖의 값', () => {
    it('나라를 안 고르면 안내', () => {
      expect(errorOf({ ...VALID, country: '' }, 'country')).toBe('나라를 선택해 주세요')
    })

    it('uuid 는 36자', () => {
      expect(errorOf({ ...VALID, uuid: 'short' }, 'uuid')).toBeDefined()
    })

    it('정해진 값이 아닌 일정 밀도 · 가격대는 거른다', () => {
      expect(errorOf({ ...VALID, scheduleType: 'RELAX' }, 'scheduleType')).toBeDefined()
      expect(errorOf({ ...VALID, priceType: 'CHEAP' }, 'priceType')).toBeDefined()
    })

    it('항공편 정보가 빠지면 거른다', () => {
      expect(errorOf({ ...VALID, arriveFlight: { flightIata: 'KE704' } }, 'arriveFlight')).toBeDefined()
    })
  })
})
