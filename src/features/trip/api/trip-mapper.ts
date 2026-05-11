import type { TripCreateFormValues, TripCreateRequest } from '../types/trip-types'

export function buildTripName(region: string[]): string {
  if (region.length === 1) return region[0]
  return `${region[0]}과 ${region[1]}`
}

export function mapFormToRequest(values: TripCreateFormValues): TripCreateRequest {
  return {
    trip: {
      name: buildTripName(values.region),
      uuid: values.uuid,
      personCount: values.personCount,
      scheduleType: values.scheduleType,
      priceType: values.priceType,
      startDate: values.startDate,
      endDate: values.endDate,
    },
    region: values.region,
    selectedPlace: values.selectedPlace,
    hotel: values.hotel,
    departFlight: values.departFlight,
    arriveFlight: values.arriveFlight,
  }
}
