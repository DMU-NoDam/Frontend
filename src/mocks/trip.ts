import type { FlightApiBody, TripCreateRequest, TripCreateResponse, TripStatusResponse } from '@/features/trip/types/trip-types'

const MOCK_TRIP_ID = 1
const MOCK_PLANNING_DURATION_MS = Number(import.meta.env.VITE_MOCK_TRIP_PLANNING_MS ?? 8000)
const mockTripPlanningStartedAt = new Map<string, number>()

export const mockCreateTrip = async (
  request: TripCreateRequest,
): Promise<TripCreateResponse> => {
  void request
  mockTripPlanningStartedAt.set(String(MOCK_TRIP_ID), Date.now())

  return Promise.resolve({
    message: 'success',
    body: { id: MOCK_TRIP_ID },
  })
}

export const mockGetTripStatus = async (
  tripId: string,
): Promise<TripStatusResponse> => {
  const startedAt = mockTripPlanningStartedAt.get(tripId) ?? Date.now()
  const isPlanning = Date.now() - startedAt < MOCK_PLANNING_DURATION_MS

  return Promise.resolve({
    message: 'success',
    body: { isPlanning },
  })
}

export const mockFlightLookup = async (
  flightIata: string,
  date: string,
): Promise<FlightApiBody> => {
  return Promise.resolve({
    flightIata,
    departureAirport: 'ICN',
    arrivalAirport: 'NRT',
    departureTime: `${date}T10:00:00`,
    arrivalTime: `${date}T12:30:00`,
  })
}
