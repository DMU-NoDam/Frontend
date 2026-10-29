import type {
  TripSummaryApiItem,
  TripThemeType,
  TripUpdateRequest,
} from '@/features/trip/types/trip-types'

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

// 매번 복사본을 돌려준다. 같은 배열을 주면 react-query가 바뀐 내용을 알아채지 못한다
export const mockGetTrips = (): Promise<TripSummaryApiItem[]> =>
  Promise.resolve(MOCK_TRIPS.map((trip) => ({ ...trip })))

// 확정·수정·삭제·테마 확정도 mock 목록 안에서 처리한다 (새로고침하면 처음 상태로 돌아간다).
// 처리하지 않으면 mock 여행 id로 실제 백엔드를 불러 남의 여행을 건드리거나 400이 난다
const findTrip = (tripId: string) => MOCK_TRIPS.find((trip) => String(trip.id) === tripId)

export const mockUpdateTripFixed = (tripId: string, fixed: boolean): Promise<void> => {
  const trip = findTrip(tripId)
  if (trip) trip.fixed = fixed
  return Promise.resolve()
}

export const mockUpdateTrip = (tripId: string, request: TripUpdateRequest): Promise<void> => {
  const trip = findTrip(tripId)
  if (trip) {
    if (request.name?.trim()) trip.name = request.name.trim()
    if (request.personCount != null) trip.personCount = request.personCount
  }
  return Promise.resolve()
}

export const mockDeleteTrip = (tripId: string): Promise<void> => {
  const index = MOCK_TRIPS.findIndex((trip) => String(trip.id) === tripId)
  if (index >= 0) MOCK_TRIPS.splice(index, 1)
  return Promise.resolve()
}

// 백엔드와 같이 테마는 처음 한 번만 정해진다
export const mockConfirmTheme = (tripId: string, theme: TripThemeType): Promise<{ message: string; body: null }> => {
  const trip = findTrip(tripId)
  if (trip && trip.tripThemeType === null) trip.tripThemeType = theme
  return Promise.resolve({ message: 'success', body: null })
}
