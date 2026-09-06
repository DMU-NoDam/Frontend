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
  date: string
  startTime: string         // "HH:mm:ss" — sorting only, not displayed
  endTime: string           // "HH:mm:ss"
  placeInfo: PlaceInfo
  fromTransport: Transport | null
  arrivalTransport?: Transport | null  // legacy field, kept for API transition
  departureTransport?: Transport | null
}

export type PlanListBody = Record<TripThemeType, PlacePlan[]>

export type PlanListResponse = {
  message: string
  body: PlanListBody
}

// ── Raw API response types ───────────────────────────────────

export type RawTransport = Omit<Transport, 'routeInfo'> & {
  routeInfo: RawRouteInfo | null
}

export type RawPlacePlan = Omit<PlacePlan, 'fromTransport' | 'arrivalTransport' | 'departureTransport'> & {
  fromTransport: RawTransport | null
  arrivalTransport?: RawTransport | null
  departureTransport?: RawTransport | null
}

// GET /plan/api/{tripId}는 DatePlan 단위 배열(날짜 x 테마)을 준다. mapper에서 테마별로 묶어
// PlanListBody(Record<theme, PlacePlan[]>)로 만든다.
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

export type RawTransportTimeObj = {
  id: number
  startTime: RawTimeObject
  endTime: RawTimeObject
  takeTime: number
  totalDistanceMeters: number
  fromPlacePlanId: number
  toPlacePlanId: number
  transportPlanId?: number
  routeInfo: RawRouteInfo | null
}

export type RawPlacePlanTimeObj = {
  id: number
  date: string
  startTime: RawTimeObject
  endTime: RawTimeObject
  placeInfo: PlaceInfo
  fromTransport: RawTransportTimeObj | null
}

export type ReplacePlacePlanRequest = {
  oldPlacePlanId: number
  newPlaceId: number
}

export type ReplacePlacePlanResponse = {
  message: string
  body: RawPlacePlanTimeObj
}

export type SwitchPlacePlanRequest = {
  placePlan1: number
  placePlan2: number
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
