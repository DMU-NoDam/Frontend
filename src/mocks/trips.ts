import type { Trip } from '@/features/trip/types/trip-types'

// 오늘 기준(2026-05-11): 다가오는 여행 3개 + 다녀온 여행 2개
const MOCK_TRIPS: Trip[] = [
  {
    id: 1,
    name: '방콕 Trip',
    personCount: 2,
    site: '방콕',
    scheduleType: 'LOOSE',
    transportType: 'PUBLIC',
    personType: 'FRIEND',
    startDate: '2026-06-15',
    endDate: '2026-06-21',
    price: 980000,
  },
  {
    id: 2,
    name: '도쿄 Trip',
    personCount: 1,
    site: '도쿄',
    scheduleType: 'TIGHT',
    transportType: 'PUBLIC',
    personType: 'SOLO',
    startDate: '2026-07-20',
    endDate: '2026-07-25',
    price: 1200000,
  },
  {
    id: 3,
    name: '발리 Trip',
    personCount: 4,
    site: '발리',
    scheduleType: 'LOOSE',
    transportType: 'PUBLIC',
    personType: 'FAMILY',
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    price: 2400000,
  },
  {
    id: 4,
    name: '제주 여행',
    personCount: 2,
    site: '제주',
    scheduleType: 'LOOSE',
    transportType: 'PRIVATE',
    personType: 'COUPLE',
    startDate: '2026-01-10',
    endDate: '2026-01-13',
    price: 600000,
  },
  {
    id: 5,
    name: '파리 여행',
    personCount: 2,
    site: '파리',
    scheduleType: 'TIGHT',
    transportType: 'PUBLIC',
    personType: 'COUPLE',
    startDate: '2025-12-24',
    endDate: '2025-12-31',
    price: 3500000,
  },
]

export const mockGetTrips = (): Promise<Trip[]> =>
  Promise.resolve(MOCK_TRIPS)
