export type ScheduleType = 'TIGHT' | 'NORMAL' | 'LOOSE'
export type PriceType = 'CHEEP' | 'NORMAL' | 'LUXURY'
export type TripThemeType = 'FOOD' | 'HEALING' | 'LANDMARK' | 'ACTIVITY'
export type TransportType = 'PUBLIC' | 'PRIVATE'
export type PersonType = 'FRIEND' | 'FAMILY' | 'COUPLE' | 'SOLO'
export type PlanStatus = 'CREATED' | 'FIXED_PLANNED' | 'AI_PLANNED' | 'TRANSPORT_PLANNED' | 'EDIT'

export type TripSummaryApiItem = {
  id: number
  name: string
  personCount: number
  scheduleType: ScheduleType
  tripThemeType: TripThemeType | null
  priceType: PriceType
  startDate: string
  endDate: string
  fixed: boolean
}

export type TripSummary = Omit<TripSummaryApiItem, 'id'> & {
  id: string
}

export type Trip = TripSummary

export type TripListResponse = {
  message: string
  body: TripSummaryApiItem[]
}

export type FlightApiBody = {
  flightIata: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
}

export type FlightApiResponse = {
  message: string
  body: FlightApiBody
}

export type FlightInfo = {
  flightIata: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
}

// backend leg shape: one airport code + one "yyyy-MM-dd HH:mm" timestamp per flight
export type TripFlightLegRequest = {
  airport: string
  time: string
}

export type TripCreateRequest = {
  trip: {
    name: string
    uuid: string
    personCount: number
    scheduleType?: ScheduleType
    priceType?: PriceType
    startDate: string
    endDate: string
  }
  region: string[]
  selectedPlace: string[]
  hotel?: string
  departFlight?: TripFlightLegRequest
  arriveFlight?: TripFlightLegRequest
}

export type TripCreateResponse = {
  message: string
  body: { id: number }
}

// `planning` 키가 맞다 — 백엔드 필드는 `isPlanning`이지만 Lombok 게터 `isPlanning()`에서
// Jackson이 `is` 접두어를 떼고 직렬화한다.
export type TripStatusResponse = {
  message: string
  body: { planStatus: PlanStatus | null; planning: boolean }
}

export type PlaceSelection = {
  id: string
  name: string
  location?: {
    lat: number
    lng: number
  }
}

export type TripUpdateRequest = {
  name: string | null
  personCount: number | null
}

export type TripCreateFormValues = {
  uuid: string
  country: string
  region: string[]
  startDate: string
  endDate: string
  personCount: number
  scheduleType?: ScheduleType
  priceType?: PriceType
  hotel: PlaceSelection[]
  departFlight?: FlightInfo
  arriveFlight?: FlightInfo
  selectedPlace: PlaceSelection[]
}
