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

export type DepartFlightInfo = {
  departureAirport: string
  departureTime: string
}

export type ArriveFlightInfo = {
  arrivalAirport: string
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
  departFlight?: DepartFlightInfo
  arriveFlight?: ArriveFlightInfo
}

export type TripCreateResponse = {
  message: string
  body: unknown
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
  hotel: string[]
  departFlight?: DepartFlightInfo
  arriveFlight?: ArriveFlightInfo
  selectedPlace: string[]
}
