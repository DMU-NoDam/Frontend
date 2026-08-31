import type { TripSummaryApiItem } from '@/features/trip/types/trip-types'

// 오늘 기준 상대 날짜. 고정 날짜를 쓰면 시간이 지나 mock 여행이 전부 과거가 되고
// "다가오는 여행" 탭이 빈 화면이 된다.
const dayOffset = (days: number): string =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

const MOCK_TRIPS: TripSummaryApiItem[] = [
  {
    id: 1,
    name: 'Bangkok Trip',
    personCount: 2,
    scheduleType: 'LOOSE',
    tripThemeType: 'FOOD',
    priceType: 'NORMAL',
    startDate: dayOffset(21),
    endDate: dayOffset(27),
    fixed: true,
  },
  {
    id: 2,
    name: 'Tokyo Trip',
    personCount: 1,
    scheduleType: 'TIGHT',
    tripThemeType: null,
    priceType: 'CHEEP',
    startDate: dayOffset(56),
    endDate: dayOffset(61),
    fixed: false,
  },
  {
    id: 3,
    name: 'Bali Trip',
    personCount: 4,
    scheduleType: 'LOOSE',
    tripThemeType: null,
    priceType: 'LUXURY',
    startDate: dayOffset(7),
    endDate: dayOffset(13),
    fixed: false,
  },
  {
    id: 4,
    name: 'Jeju Trip',
    personCount: 2,
    scheduleType: 'LOOSE',
    tripThemeType: 'ACTIVITY',
    priceType: 'NORMAL',
    startDate: dayOffset(-226),
    endDate: dayOffset(-223),
    fixed: true,
  },
  {
    id: 5,
    name: 'Paris Trip',
    personCount: 2,
    scheduleType: 'TIGHT',
    tripThemeType: 'LANDMARK',
    priceType: 'LUXURY',
    startDate: dayOffset(-243),
    endDate: dayOffset(-236),
    fixed: true,
  },
]

export const mockGetTrips = (): Promise<TripSummaryApiItem[]> =>
  Promise.resolve(MOCK_TRIPS)
