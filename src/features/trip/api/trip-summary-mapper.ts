import type { TripSummary, TripSummaryApiItem } from '../types/trip-types'

export function mapTripSummary(item: TripSummaryApiItem): TripSummary {
  return {
    ...item,
    id: String(item.id),
  }
}
