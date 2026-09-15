import { getCitiesByCountry } from '../data/cities'
import type { TripCreateFormValues, TripCreateRequest } from '../types/trip-types'

export function buildTripName(region: string[], country: string): string {
  const cities = getCitiesByCountry(country)
  const names = region.map((id) => cities.find((city) => city.id === id)?.name ?? id)

  if (names.length === 1) return names[0]
  return `${names[0]}과 ${names[1]}`
}

export function mapFormToRequest(values: TripCreateFormValues): TripCreateRequest {
  const request: TripCreateRequest = {
    trip: {
      name: buildTripName(values.region, values.country),
      uuid: values.uuid,
      personCount: values.personCount,
      scheduleType: values.scheduleType ?? 'NORMAL',
      priceType: values.priceType ?? 'NORMAL',
      startDate: values.startDate,
      endDate: values.endDate,
    },
    region: values.region,
    selectedPlace: values.selectedPlace.map((p) => p.id),
    departFlight: values.departFlight
      ? { airport: values.departFlight.arrivalAirport, time: values.departFlight.arrivalTime }
      : undefined,
    arriveFlight: values.arriveFlight
      ? { airport: values.arriveFlight.departureAirport, time: values.arriveFlight.departureTime }
      : undefined,
  }

  if (values.hotel[0]) {
    request.hotel = values.hotel[0].id
  }

  return request
}
