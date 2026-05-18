export type ScheduleType = 'TIGHT' | 'NORMAL' | 'LOOSE'
export type PriceType = 'CHEEP' | 'NORMAL' | 'LUXURY'

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
  hotel: string[]
  departFlight?: FlightInfo
  arriveFlight?: FlightInfo
}

export type TripCreateResponse = {
  message: string
  body: { tripId: string }
}

export type TripStatusResponse = {
  message: string
  body: { isPlanning: boolean }
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
