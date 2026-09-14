import type { PriceType, TripThemeType } from './trip-types'
export type { TripThemeType } from './trip-types'

// lon/lat as the backend sends them (lon, not lng)
export type LatLon = {
  lat: number
  lon: number
}

// kept for Google Maps usage elsewhere
export type LatLng = {
  lat: number
  lng: number
}

// ── Domain types (after mapping) ─────────────────────────────

export type RouteStep = {
  method: string    // "WALK" | "TRAIN"
  path: LatLng[]   // [start, ...polygon waypoints, end] — Google Maps ready
}

export type RouteInfo = {
  totalDistanceMeters: number
  totalDurationSeconds: number
  steps: RouteStep[]
}

// ── Raw API types (match backend JSON exactly) ───────────────

export type RawCoordPoint = {
  coordinate: { lat: number; lng: number }
  name: string
}

export type RawRouteStep = {
  start: RawCoordPoint
  end: RawCoordPoint
  methodType: string
  polygon: RawCoordPoint[]
}

export type RawRouteInfo = {
  totalDistanceMeters: number
  totalDurationSeconds: number
  steps: RawRouteStep[]
}

export type Transport = {
  id: number
  startTime: string
  endTime: string
  takeTime: number          // seconds
  totalDistanceMeters: number
  fromPlacePlanId: number
  toPlacePlanId: number
  transportPlanId?: number
  routeInfo: RouteInfo | null
}

export type PlaceType = string

export type PlaceInfo = {
  id: number
  regionId: number
  placeType: PlaceType
  googleId: string
  name: string
  address: string
  priceType: PriceType | null
  lon: number
  lat: number
}

export type PlacePlan = {
  id: number
  // 편집 API(add/change/move/remove-place)는 DatePlan 단위로 호출한다. 어떤 일정에서 편집이
  // 시작되든 그 DatePlan을 찾을 수 있도록 각 PlacePlan이 소속 id를 들고 있는다.
  datePlanId: number
  // 소속 DatePlan 안에서의 순서. 화면 정렬 기준이다 — startTime은 순서를 바꾼 직후 아직
  // 재계산되기 전일 수 있어서 기준으로 쓸 수 없다. DatePlan을 넘어서는 비교는 의미가 없다.
  orderIndex: number
  date: string
  startTime: string         // "HH:mm:ss" — sorting only, not displayed
  endTime: string           // "HH:mm:ss"
  placeInfo: PlaceInfo
  fromTransport: Transport | null
  arrivalTransport?: Transport | null  // legacy field, kept for API transition
  departureTransport?: Transport | null
}

// 편집(CAS)의 단위. 백엔드 DatePlanInfo와 1:1이며, version은 이 DatePlan에 적용된 편집 횟수다
// (편집 이력이 없으면 0). 편집 요청은 이 version을 그대로 실어 보내고, 응답으로 온 DatePlan
// 전체로 교체한다 — 서버가 CAS 루프 안에서 rebase까지 끝내주므로 클라이언트 재시도는 없다.
export type DatePlan = {
  id: number
  date: string
  theme: TripThemeType
  version: number
  plans: PlacePlan[]
}

// 화면용 파생 형태. 같은 테마의 날짜들을 한 코스로 이어붙인 것으로, 캐시의 원본이 아니다
export type PlanListBody = Record<TripThemeType, PlacePlan[]>

// 캐시에 저장하는 원본. DatePlan 단위라 편집 응답을 그대로 갈아끼울 수 있다
export type PlanListResponse = {
  message: string
  datePlans: DatePlan[]
}

// datePlanId를 알 수 없는 곳에서 PlacePlan을 만들 때 쓴다 (mock, 구 replace 응답 매퍼).
// 기존 PlacePlan 위에 병합해 datePlanId를 물려받는다.
export type PlacePlanPatch = Omit<PlacePlan, 'datePlanId' | 'orderIndex'>

// ── Raw API response types ───────────────────────────────────

export type RawTransport = Omit<Transport, 'routeInfo'> & {
  routeInfo: RawRouteInfo | null
}

export type RawPlacePlan = Omit<PlacePlan, 'datePlanId' | 'fromTransport' | 'arrivalTransport' | 'departureTransport'> & {
  fromTransport: RawTransport | null
  arrivalTransport?: RawTransport | null
  departureTransport?: RawTransport | null
}

// GET /plan/api/{tripId}는 DatePlan 단위 배열(날짜 x 테마)을 준다. mapper가 DatePlan 형태를
// 유지한 채 매핑하고, 테마별 코스(PlanListBody)는 거기서 파생시킨다.
export type RawDatePlan = {
  id: number
  date: string
  datePlanTheme: TripThemeType
  version: number
  placePlanInfos: RawPlacePlan[]
}

export type RawPlanListResponse = {
  message: string
  body: RawDatePlan[]
}

export type TripThemeConfirmResponse = {
  message: string
  body: null
}

export type PlanThemeCard = {
  theme: TripThemeType
  title: string
  subtitle: string
  emojis: string[]
  plans: PlacePlan[]
  dayCount: number
  nightCount: number
  scheduleCount: number
  totalMoveMinutes: number
  totalDistanceMeters: number
  summary: string
}

// ── Edit / Recommend API types ───────────────────────────────

export type RawTimeObject = {
  hour: number
  minute: number
  second: number
  nano: number
}

// ── PlacePlan 편집 API (CAS) ─────────────────────────────────
// 편집은 DatePlan 단위로 한다. 어떤 동작이든 대상 DatePlan의 id와, 내가 마지막으로 읽은
// version을 함께 보낸다. version이 낡아도 서버가 CAS 루프 안에서 rebase하므로 클라이언트가
// 재시도하거나 version을 미리 맞출 필요는 없다.
export type PlanEditTarget = {
  datePlanId: number
  version: number
}

// 위치는 인덱스가 아니라 이웃으로 지정한다. 맨 앞이면 previous=null, 맨 뒤면 next=null.
type NeighbourPosition = {
  previousPlacePlanId: number | null
  nextPlacePlanId: number | null
}

export type AddPlaceRequest = PlanEditTarget & NeighbourPosition & {
  placeId: number
}

export type ChangePlaceRequest = PlanEditTarget & {
  placePlanId: number
  placeId: number
}

export type MovePlaceRequest = PlanEditTarget & NeighbourPosition & {
  placePlanId: number
}

export type RemovePlaceRequest = PlanEditTarget & {
  placePlanId: number
}

// 편집 응답은 그 DatePlan 전체다 (version 포함). 캐시의 해당 DatePlan을 통째로 교체한다.
export type DatePlanResponse = {
  message: string
  body: RawDatePlan
}

export type RecommendPlaceRequest = {
  placePlanId: number
  placeType: PlaceType
  userLat: null
  userLon: null
  weather: null
  time: null
}

export type RawRecommendedPlaceItem = {
  place: PlaceInfo
  travelDurationSeconds: number
  travelDistanceMeters: number
  startTime: RawTimeObject
  endTime: RawTimeObject
}

export type RecommendPlaceResponse = {
  message: string
  body: RawRecommendedPlaceItem[]
}

export type RecommendedPlaceItem = {
  place: PlaceInfo
  travelDurationSeconds: number
  travelDistanceMeters: number
  startTime: string
  endTime: string
}
