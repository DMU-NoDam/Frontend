import type { PlaceInfo, PlacePlan, PlanListResponse, RecommendedPlaceItem, RouteInfo, Transport } from '@/features/trip/types/plan-types'

// ── helpers ──────────────────────────────────────────────────

function place(
  id: number,
  regionId: number,
  placeType: PlaceInfo['placeType'],
  googleId: string,
  name: string,
  address: string,
  lat: number,
  lon: number,
): PlaceInfo {
  return { id, regionId, placeType, googleId, name, address, priceType: 'NORMAL', lat, lon }
}

function transport(
  id: number,
  startTime: string,
  endTime: string,
  takeSeconds: number,
  distanceMeters: number,
  fromId: number,
  toId: number,
  routeInfo: RouteInfo | null = null,
): Transport {
  return {
    id,
    startTime,
    endTime,
    takeTime: takeSeconds,
    totalDistanceMeters: distanceMeters,
    fromPlacePlanId: fromId,
    toPlacePlanId: toId,
    routeInfo,
  }
}

// ── Bangkok route mock data (domain format) ───────────────────

const bkkRoute_chatuchakToJayFai: RouteInfo = {
  totalDistanceMeters: 2500,
  totalDurationSeconds: 1200,
  steps: [
    {
      method: 'WALK',
      path: [
        { lat: 13.7999, lng: 100.5499 },
        { lat: 13.7985, lng: 100.5503 },
      ],
    },
    {
      method: 'TRAIN',
      path: [
        { lat: 13.7985, lng: 100.5503 },
        { lat: 13.7831, lng: 100.5450 },
        { lat: 13.7761, lng: 100.5302 },
        { lat: 13.7648, lng: 100.5237 },
        { lat: 13.7545, lng: 100.5025 },
      ],
    },
    {
      method: 'WALK',
      path: [
        { lat: 13.7545, lng: 100.5025 },
        { lat: 13.7534, lng: 100.5015 },
      ],
    },
  ],
}

const bkkRoute_jayFaiToOrTorKor: RouteInfo = {
  totalDistanceMeters: 1200,
  totalDurationSeconds: 900,
  steps: [
    {
      method: 'WALK',
      path: [
        { lat: 13.7534, lng: 100.5015 },
        { lat: 13.7548, lng: 100.5030 },
      ],
    },
    {
      method: 'TRAIN',
      path: [
        { lat: 13.7548, lng: 100.5030 },
        { lat: 13.7700, lng: 100.5180 },
        { lat: 13.7860, lng: 100.5380 },
        { lat: 13.8019, lng: 100.5495 },
      ],
    },
  ],
}

function plan(
  id: number,
  date: string,
  startTime: string,
  endTime: string,
  placeInfo: PlaceInfo,
  fromTransport: Transport | null = null,
): PlacePlan {
  return { id, date, startTime, endTime, placeInfo, fromTransport }
}

// ── Bangkok Trip (id: '1') ────────────────────────────────────
// tripThemeType: FOOD  /  June 15–17, 2026

const BKK = {
  // FOOD places
  chatuchak:  place(1001, 1, 'SIGHT',      'ChIJN1t_tDeuEmsRUsoyG83frY4', '짜뚜짝 주말시장',         'Kamphaeng Phet 2 Rd, Bangkok', 13.7999, 100.5499),
  jayFai:     place(1002, 1, 'RESTAURANT', 'ChIJRXABwPqf4jARWCGZiYBWRNk', 'Jay Fai',                 '327 Maha Chai Rd, Bangkok',   13.7534, 100.5015),
  orTorKor:   place(1003, 1, 'SIGHT',      'ChIJ00a2VHCS4jARmjTzXmtZnZg', 'Or Tor Kor 시장',         'Kamphaeng Phet Rd, Bangkok',  13.8019, 100.5495),
  yaowarat:   place(1004, 1, 'SIGHT',      'ChIJtdVn7uCS4jAR43REr3Y0GXE', '야와랏 차이나타운',        'Yaowarat Rd, Bangkok',        13.7400, 100.5106),
  tkSeafood:  place(1005, 1, 'RESTAURANT', 'ChIJQXABwPqf4jARqjTzXmtZnZg', 'T&K 씨푸드',              '49-51 Chakrawat Rd, Bangkok', 13.7390, 100.5110),
  iconsiam:   place(1006, 1, 'SHOPPING',   'ChIJ9RHlXjuf4jARW3sHFMqrFXk', 'ICONSIAM',                '299 Charoen Nakhon Rd',       13.7264, 100.5107),
  lumphini:   place(1007, 1, 'SIGHT',      'ChIJi1-vHaes4jARLMuMZIktnYA', '룸피니 공원',             'Rama IV Rd, Bangkok',         13.7319, 100.5415),
  siamParagon:place(1008, 1, 'SHOPPING',   'ChIJy_3nTKSf4jARqGnlGMvKUcQ', '시암 파라곤',             '991 Rama I Rd, Bangkok',      13.7466, 100.5349),
  mbk:        place(1009, 1, 'SHOPPING',   'ChIJx7_UYqOf4jARjsHgBknCFnY', 'MBK Center',              '444 Phaya Thai Rd, Bangkok',  13.7455, 100.5298),

  // HEALING places
  watPho:     place(1011, 1, 'SIGHT',      'ChIJIQJBKOyf4jARH2gcGSCqEKQ', '왓 포 (와불사원)',        'Sanam Chai Rd, Bangkok',      13.7465, 100.4927),
  thaiSpa:    place(1012, 1, 'ACTIVITY',   'ChIJspaTdO2f4jARtSwHhgqzDDo', 'Health Land 스파',        '120 North Sathon Rd',         13.7220, 100.5241),
  bangkokPark:place(1013, 1, 'SIGHT',      'ChIJj3MKn-mg4jARhJz5vN1RmoI', '벤짜끼띠 공원',           'Ratchadaphisek Rd, Bangkok',  13.7560, 100.5601),

  // LANDMARK places
  grandPalace:place(1021, 1, 'CULTURE',    'ChIJnUbQy-yf4jARGCUCJzGH5ME', '왕궁 (그랜드 팰리스)',    'Na Phra Lan Rd, Bangkok',     13.7500, 100.4913),
  watArun:    place(1022, 1, 'CULTURE',    'ChIJe4iqMOyf4jARHzXrN-KCaO0', '왓 아룬 (새벽사원)',      '158 Wang Doem Rd, Bangkok',   13.7439, 100.4888),
  watSaket:   place(1023, 1, 'SIGHT',      'ChIJRXQBEu2f4jARvNrJBvz7mP4', '왓 사껫 (골든 마운틴)',   'Chakkraphatdi Phong Rd',      13.7539, 100.5076),

  // ACTIVITY places
  ayutthaya:  place(1031, 1, 'CULTURE',    'ChIJa9IpyGjv4DARXJa6nW3DPVQ', '아유타야 역사공원',       'Ayutthaya, Thailand',         14.3550, 100.5698),
  muayThai:   place(1032, 1, 'ACTIVITY',   'ChIJQ3AQwOOf4jARIFJ0TGRhDUM', '루엠핏 무에타이 체육관',  '6 Ratchadamnoen Nok Ave',     13.7618, 100.5014),
  cookingClass:place(1033,1, 'ACTIVITY',   'ChIJHUlJMjmZ4jARLGRmvukmhd8', 'Baipai 요리교실',         '8/91 Ngam Wong Wan Rd',       13.8302, 100.5675),
}

const T_BKK = {
  t1: transport(2001, '11:30:00', '11:50:00', 1200, 2500, 1001, 1002, bkkRoute_chatuchakToJayFai),
  t2: transport(2002, '14:00:00', '14:15:00',  900, 1200, 1002, 1003, bkkRoute_jayFaiToOrTorKor),
  t3: transport(2003, '12:00:00', '12:10:00',  600,  800, 1004, 1005),
  t4: transport(2004, '14:00:00', '14:25:00', 1500, 3500, 1005, 1006),
  t5: transport(2005, '11:00:00', '11:15:00',  900, 1500, 1007, 1008),
  t6: transport(2006, '13:30:00', '13:35:00',  300,  300, 1008, 1009),
}

const D1 = '2026-06-15'
const D2 = '2026-06-16'
const D3 = '2026-06-17'

const FOOD_PLANS: PlacePlan[] = [
  plan(1001, D1, '09:00:00', '11:30:00', BKK.chatuchak,  T_BKK.t1),
  plan(1002, D1, '12:00:00', '14:00:00', BKK.jayFai,     T_BKK.t2),
  plan(1003, D1, '14:30:00', '17:00:00', BKK.orTorKor,   null),

  plan(1004, D2, '10:00:00', '12:00:00', BKK.yaowarat,   T_BKK.t3),
  plan(1005, D2, '12:30:00', '14:00:00', BKK.tkSeafood,  T_BKK.t4),
  plan(1006, D2, '15:00:00', '18:00:00', BKK.iconsiam,   null),

  plan(1007, D3, '09:00:00', '11:00:00', BKK.lumphini,   T_BKK.t5),
  plan(1008, D3, '11:30:00', '13:30:00', BKK.siamParagon,T_BKK.t6),
  plan(1009, D3, '14:00:00', '16:30:00', BKK.mbk,        null),
]

const HEALING_PLANS: PlacePlan[] = [
  plan(1011, D1, '10:00:00', '13:00:00', BKK.watPho,     null),
  plan(1012, D1, '14:00:00', '17:00:00', BKK.thaiSpa,    null),
  plan(1013, D2, '09:00:00', '12:00:00', BKK.bangkokPark,null),
  plan(1014, D2, '14:00:00', '17:00:00', BKK.thaiSpa,    null),
]

const LANDMARK_PLANS: PlacePlan[] = [
  plan(1021, D1, '08:00:00', '11:00:00', BKK.grandPalace, null),
  plan(1022, D1, '11:30:00', '13:30:00', BKK.watArun,     null),
  plan(1023, D2, '09:00:00', '12:00:00', BKK.watSaket,    null),
]

const ACTIVITY_PLANS: PlacePlan[] = [
  plan(1031, D1, '07:00:00', '16:00:00', BKK.ayutthaya,    null),
  plan(1032, D2, '18:00:00', '21:00:00', BKK.muayThai,     null),
  plan(1033, D3, '09:00:00', '13:00:00', BKK.cookingClass, null),
]

// ── Jeju Trip (id: '4') ───────────────────────────────────────
// tripThemeType: ACTIVITY  /  Jan 10–13, 2026

const JJ = {
  sunrise:  place(2001, 10, 'SIGHT',    'ChIJN2HZzUL0DDURo4ynkUhsRNY', '성산일출봉',          '제주특별자치도 서귀포시 성산읍 일출로 284-12', 33.4581, 126.9425),
  hallasan: place(2002, 10, 'ACTIVITY', 'ChIJB3GKwmhQDDURcA_L7iH96FI', '한라산 어리목 탐방',  '제주특별자치도 제주시 해안동 산 220-1',       33.3617, 126.5292),
  olle:     place(2003, 10, 'ACTIVITY', 'ChIJRY6k6XP0DDURqOEeTxLHYk8', '제주 올레길 7코스',   '제주특별자치도 서귀포시 법환동',              33.2460, 126.5085),
  zipline:  place(2004, 10, 'ACTIVITY', 'ChIJC4qGaQj1DDURYTl9I_AELdI', '서귀포 짚라인',       '제주특별자치도 서귀포시 1100로 589',          33.3014, 126.5310),
  snorkel:  place(2005, 10, 'ACTIVITY', 'ChIJJ7Xk5IT0DDURuElr4VqzF-I', '함덕 해수욕장 스노클','제주특별자치도 제주시 조천읍 함덕리 1008',    33.5431, 126.6694),
}

const T_JJ = {
  t1: transport(3001, '16:00:00', '16:40:00', 2400, 28000, 2001, 2002),
  t2: transport(3002, '12:00:00', '12:25:00', 1500, 18000, 2003, 2004),
}

const J1 = '2026-01-10'
const J2 = '2026-01-11'
const J3 = '2026-01-12'
const J4 = '2026-01-13'

const JEJU_ACTIVITY_PLANS: PlacePlan[] = [
  plan(2001, J1, '06:00:00', '10:00:00', JJ.sunrise,  T_JJ.t1),
  plan(2002, J1, '11:00:00', '15:00:00', JJ.hallasan, null),

  plan(2003, J2, '09:00:00', '12:00:00', JJ.olle,     T_JJ.t2),
  plan(2004, J2, '13:00:00', '16:00:00', JJ.zipline,  null),

  plan(2005, J3, '10:00:00', '14:00:00', JJ.snorkel,  null),
  plan(2006, J4, '09:00:00', '12:00:00', JJ.sunrise,  null),
]

// ── exports ──────────────────────────────────────────────────

const EMPTY = { FOOD: [], HEALING: [], LANDMARK: [], ACTIVITY: [] } as const

const MOCK_PLANS: Record<string, PlanListResponse> = {
  '1': {
    message: 'success',
    body: { FOOD: FOOD_PLANS, HEALING: HEALING_PLANS, LANDMARK: LANDMARK_PLANS, ACTIVITY: ACTIVITY_PLANS },
  },
  '4': {
    message: 'success',
    body: { FOOD: [], HEALING: [], LANDMARK: [], ACTIVITY: JEJU_ACTIVITY_PLANS },
  },
}

export const mockGetPlans = (tripId: string): Promise<PlanListResponse> =>
  Promise.resolve(MOCK_PLANS[tripId] ?? { message: 'success', body: { ...EMPTY } })

const MOCK_RECOMMEND_PLACES: RecommendedPlaceItem[] = [
  { place: BKK.orTorKor,    travelDurationSeconds: 900,  travelDistanceMeters: 1200, startTime: '14:30:00', endTime: '17:00:00' },
  { place: BKK.watPho,      travelDurationSeconds: 1800, travelDistanceMeters: 3500, startTime: '14:30:00', endTime: '17:00:00' },
  { place: BKK.lumphini,    travelDurationSeconds: 1200, travelDistanceMeters: 2100, startTime: '14:30:00', endTime: '17:00:00' },
  { place: BKK.siamParagon, travelDurationSeconds: 2400, travelDistanceMeters: 4800, startTime: '14:30:00', endTime: '17:00:00' },
]

export const mockRecommendPlace = (): Promise<RecommendedPlaceItem[]> =>
  Promise.resolve(MOCK_RECOMMEND_PLACES)

export const mockReplacePlacePlan = (oldPlacePlanId: number, newPlaceId: number): Promise<PlacePlan> => {
  const allPlaces = Object.values(BKK)
  const newPlace = allPlaces.find((p) => p.id === newPlaceId) ?? BKK.watPho
  return Promise.resolve({
    id: oldPlacePlanId,
    date: D1,
    startTime: '14:30:00',
    endTime: '17:00:00',
    placeInfo: newPlace,
    fromTransport: null,
  })
}

export const mockDeletePlacePlan = (): Promise<void> =>
  Promise.resolve()
