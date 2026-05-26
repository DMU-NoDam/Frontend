import { useMemo, useState } from 'react'
import type { PlacePlan, PlaceType, Transport } from '../types/plan-types'
import './TripScheduleView.css'

const PLACE_TYPE_LABEL: Record<PlaceType, string> = {
  AIRPORT:    '공항',
  SIGHT:      '관광지',
  RESTAURANT: '음식점',
  HOTEL:      '숙소',
  CAFE:       '카페',
  SHOPPING:   '쇼핑',
  ACTIVITY:   '액티비티',
  CULTURE:    '문화·예술',
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `${h}시간` : `${h}시간 ${rem}분`
}

function getSortedDates(plans: PlacePlan[]): string[] {
  return [...new Set(plans.map((p) => p.date))].sort()
}

function groupByDate(plans: PlacePlan[]): Map<string, PlacePlan[]> {
  const map = new Map<string, PlacePlan[]>()
  for (const plan of plans) {
    const arr = map.get(plan.date) ?? []
    arr.push(plan)
    map.set(plan.date, arr)
  }
  return map
}

function sortByStartTime(plans: PlacePlan[]): PlacePlan[] {
  return [...plans].sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function formatDateLabel(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function TransportRow({ transport }: { transport: Transport }) {
  return (
    <div className="trip-schedule-view__transport-row" aria-label="이동 정보">
      <div className="trip-schedule-view__transport-line" aria-hidden="true" />
      <span className="trip-schedule-view__transport-info">
        {formatDuration(transport.takeTime)} · {formatDistance(transport.totalDistanceMeters)}
      </span>
    </div>
  )
}

function PlaceCard({ plan, index }: { plan: PlacePlan; index: number }) {
  const { placeInfo } = plan
  return (
    <div className="trip-schedule-view__place-card">
      <div className="trip-schedule-view__place-num" aria-hidden="true">
        {index + 1}
      </div>
      <div className="trip-schedule-view__place-body">
        <span className="trip-schedule-view__place-name">{placeInfo.name}</span>
        <span className="trip-schedule-view__place-type">
          {PLACE_TYPE_LABEL[placeInfo.placeType] ?? placeInfo.placeType}
        </span>
      </div>
    </div>
  )
}

export type TripScheduleViewProps = {
  plans: PlacePlan[]
  initialDate?: string
  emptyMessage?: string
}

export function TripScheduleView({ plans, initialDate, emptyMessage }: TripScheduleViewProps) {
  const sortedDates = useMemo(() => getSortedDates(plans), [plans])
  const grouped     = useMemo(() => groupByDate(plans),    [plans])

  // Tracks explicit user tab selection; null means "use initialDate / first date"
  const [userSelectedDate, setUserSelectedDate] = useState<string | null>(null)

  const selectedDate = useMemo(() => {
    if (userSelectedDate && sortedDates.includes(userSelectedDate)) return userSelectedDate
    if (initialDate && sortedDates.includes(initialDate)) return initialDate
    return sortedDates[0] ?? null
  }, [userSelectedDate, sortedDates, initialDate])

  const selectedDayIndex = selectedDate ? sortedDates.indexOf(selectedDate) : 0

  const plansForDay = useMemo(() => {
    if (!selectedDate) return []
    return sortByStartTime(grouped.get(selectedDate) ?? [])
  }, [grouped, selectedDate])

  if (sortedDates.length === 0) {
    return (
      <div className="trip-schedule-view__status">
        {emptyMessage ?? '일정이 없습니다.'}
      </div>
    )
  }

  return (
    <>
      <nav className="trip-schedule-view__day-tabs" role="tablist" aria-label="날짜 선택">
        {sortedDates.map((date, i) => (
          <button
            key={date}
            role="tab"
            type="button"
            aria-selected={i === selectedDayIndex}
            className={`trip-schedule-view__day-tab${i === selectedDayIndex ? ' trip-schedule-view__day-tab--active' : ''}`}
            onClick={() => setUserSelectedDate(date)}
          >
            <span className="trip-schedule-view__day-label">Day {i + 1}</span>
            <span className="trip-schedule-view__day-date">{formatDateLabel(date)}</span>
          </button>
        ))}
      </nav>

      <div className="trip-schedule-view__list">
        {plansForDay.map((plan, i) => (
          <div key={plan.id}>
            <PlaceCard plan={plan} index={i} />
            {plan.arrivalTransport && (
              <TransportRow transport={plan.arrivalTransport} />
            )}
          </div>
        ))}
      </div>
    </>
  )
}
