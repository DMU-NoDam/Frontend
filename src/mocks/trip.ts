import type { FlightApiBody, TripCreateRequest, TripCreateResponse } from '@/features/trip/types/trip-types'

export const mockCreateTrip = async (
  request: TripCreateRequest,
): Promise<TripCreateResponse> => {
  void request
  return Promise.resolve({
    message: 'success',
    body: {},
  })
}

export const mockFlightLookup = async (flightIata: string): Promise<FlightApiBody> => {
  return Promise.resolve({
    flightIata,
    departureAirport: 'ICN',
    arrivalAirport: 'NRT',
    departureTime: '2025-07-01T10:00:00',
    arrivalTime: '2025-07-01T12:30:00',
  })
}
