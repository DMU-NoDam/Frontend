import type { PriceType, ScheduleType } from './trip-types'

export type TripThemeType = 'FOOD' | 'HEALING' | 'LANDMARK' | 'ACTIVITY'

export type LocalTime = {
  hour: number
  minute: number
  second: number
  nano: number
}

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
  start: LatLng
  end: LatLng
  polyline: LatLng[]
  distanceMeters: number
  durationSeconds: number
  travelMode: string
  transitInfo?: TransitInfo
}

export type RouteInfo = {
  totalDistanceMeters: number
  totalDurationSeconds: number
  steps: RouteStep[]
}

export type Transport = {
  id: number
  startTime: LocalTime
  endTime: LocalTime
  takeTime: number
  totalDistanceMeters: number
  fromPlacePlanId: number
  toPlacePlanId: number
  routeInfo?: RouteInfo
}

export type PlacePlan = {
  id: number
  date: string
  startTime: LocalTime
  endTime: LocalTime
  placeId: number
  departureTransport?: Transport
  arrivalTransport?: Transport
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
