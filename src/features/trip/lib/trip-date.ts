import type { TripSummary } from '../types/trip-types'

export function getDdayLabel(startDate: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'D-Day'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

export function isTripActive(startDate: string, endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return start <= today && today <= end
}

export function getNextFixedTrip(trips: TripSummary[]): TripSummary | undefined {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return trips
    .filter((t) => t.fixed && new Date(t.endDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]
}

