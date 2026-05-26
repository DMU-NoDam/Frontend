export type ScheduleType = 'TIGHT' | 'NORMAL' | 'LOOSE'
export type PriceType = 'CHEEP' | 'NORMAL' | 'LUXURY'
export type TripThemeType = 'FOOD' | 'HEALING' | 'LANDMARK' | 'ACTIVITY'
export type TransportType = 'PUBLIC' | 'PRIVATE'
export type PersonType = 'FRIEND' | 'FAMILY' | 'COUPLE' | 'SOLO'

export type TripSummaryApiItem = {
  id: number
  name: string
  personCount: number
  scheduleType: ScheduleType
  tripThemeType: TripThemeType | null
  priceType: PriceType
  startDate: string
  endDate: string
  isPlanning: boolean
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
  departFlight?: FlightInfo
  arriveFlight?: FlightInfo
}

export type TripCreateResponse = {
  message: string
  body: { id: number }
}

export type TripStatusResponse = {
  message: string
  body: { allCompleted: boolean; planning: boolean }
}

export type PlaceSelection = {
  id: string
  name: string
  location?: {
    lat: number
    lng: number
  }
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
