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

// 아직 끝나지 않은 확정 여행 (출발일이 가까운 순)
export function getUpcomingFixedTrips(trips: TripSummary[]): TripSummary[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return trips
    .filter((t) => t.fixed && new Date(t.endDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}

export function getNextFixedTrip(trips: TripSummary[]): TripSummary | undefined {
  return getUpcomingFixedTrips(trips)[0]
}

// 'yyyy-MM-dd' 두 개 → '11/2–11/4'. Date로 바꾸지 않아 시간대에 따라 날짜가 밀리지 않는다
export function formatTripPeriod(startDate: string, endDate: string): string {
  const toMonthDay = (date: string) => {
    const [, month, day] = date.split('-').map(Number)
    return `${month}/${day}`
  }
  return `${toMonthDay(startDate)}–${toMonthDay(endDate)}`
}

// 여행 중이면 '여행 중', 아니면 D-day
export function getTripStatusLabel(trip: TripSummary): string {
  return isTripActive(trip.startDate, trip.endDate) ? '여행 중' : getDdayLabel(trip.startDate)
}

