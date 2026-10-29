import type { TripSummaryApiItem } from '@/features/trip/types/trip-types'

// 오늘 기준 상대 날짜. 고정 날짜를 쓰면 시간이 지나 mock 여행이 전부 과거가 되고
// "다가오는 여행" 탭이 빈 화면이 된다.
const dayOffset = (days: number): string =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)

// 1번(Bangkok)은 mocks/plans.ts·mocks/memos.ts의 일정·메모가 연결된 여행이라 그대로 둔다.
// 가장 가까운 확정 여행이어야 홈·여행도구 탭이 이 일정을 보여준다.
// 나머지는 도시 사진(src/assets/city)이 있는 일본 도시 위주로, 사진 없는 도시(후쿠오카)도 하나 둔다.
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
    name: '도쿄',
    regionCodes: ['jp-tokyo'],
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
    name: '오사카와 교토',
    regionCodes: ['jp-osaka', 'jp-kyoto'],
    personCount: 4,
    scheduleType: 'LOOSE',
    tripThemeType: null,
    priceType: 'NORMAL',
    startDate: dayOffset(7),
    endDate: dayOffset(13),
    fixed: false,
  },
  {
    id: 6,
    name: '삿포로',
    regionCodes: ['jp-sapporo'],
    personCount: 2,
    scheduleType: 'NORMAL',
    tripThemeType: 'LANDMARK',
    priceType: 'LUXURY',
    startDate: dayOffset(35),
    endDate: dayOffset(39),
    fixed: true,
  },
  {
    id: 7,
    name: '나하',
    regionCodes: ['jp-naha'],
    personCount: 3,
    scheduleType: 'LOOSE',
    tripThemeType: null,
    priceType: 'NORMAL',
    startDate: dayOffset(48),
    endDate: dayOffset(52),
    fixed: false,
  },
  {
    id: 8,
    name: '히로시마',
    regionCodes: ['jp-hiroshima'],
    personCount: 2,
    scheduleType: 'NORMAL',
    tripThemeType: null,
    priceType: 'NORMAL',
    startDate: dayOffset(70),
    endDate: dayOffset(72),
    fixed: false,
  },
  {
    id: 9,
    name: '나고야',
    regionCodes: ['jp-nagoya'],
    personCount: 1,
    scheduleType: 'TIGHT',
    tripThemeType: null,
    priceType: 'CHEEP',
    startDate: dayOffset(90),
    endDate: dayOffset(92),
    fixed: false,
  },
  {
    id: 4,
    name: '후쿠오카',
    regionCodes: ['jp-fukuoka'],
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
    name: '교토',
    regionCodes: ['jp-kyoto'],
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
