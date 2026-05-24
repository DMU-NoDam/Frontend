import type { PriceType, ScheduleType, TripThemeType } from './trip-types'
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

export type TransitInfo = {
  lineName: string
  lineShortName: string
  vehicleType: string
  departureStopName: string
  arrivalStopName: string
  stopCount: number
}

export type RouteStep = {
  start: LatLon
  end: LatLon
  polyline: LatLon[]
  distanceMeters: number
  durationSeconds: number
  travelMode: string
  transitInfo: TransitInfo | null
}

export type RouteInfo = {
  totalDistanceMeters: number
  totalDurationSeconds: number
  steps: RouteStep[]
}

export type Transport = {
  id: number
  startTime: string
  endTime: string
  takeTime: number          // seconds
  totalDistanceMeters: number
  fromPlacePlanId: number
  toPlacePlanId: number
  routeInfo: RouteInfo | null
}

export type PlaceType =
  | 'SIGHT'
  | 'RESTAURANT'
  | 'HOTEL'
  | 'CAFE'
  | 'SHOPPING'
  | 'ACTIVITY'
  | 'CULTURE'

export type PlaceInfo = {
  id: number
  regionId: number
  placeType: PlaceType
  googleId: string
  name: string
  address: string
  priceType: PriceType
  lon: number
  lat: number
}

export type PlacePlan = {
  id: number
  date: string
  startTime: string         // "HH:mm:ss" — sorting only, not displayed
  endTime: string           // "HH:mm:ss"
  placeInfo: PlaceInfo
  departureTransport: Transport | null
  arrivalTransport: Transport | null
}

export type PlanListBody = Record<TripThemeType, PlacePlan[]>

export type PlanListResponse = {
  message: string
  body: PlanListBody
}

export type FixedTrip = {
  id: number
  name: string
  personCount: number
  scheduleType: ScheduleType
  tripThemeType: TripThemeType
  priceType: PriceType
  startDate: string
  endDate: string
  isPlanning: boolean
  fixed: boolean
}

export type TripThemeConfirmResponse = {
  message: string
  body: FixedTrip
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
  averageMoveMinutes: number
  totalDistanceMeters: number
  summary: string
}
