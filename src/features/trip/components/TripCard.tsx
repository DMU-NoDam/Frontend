import clsx from 'clsx'
import { LuMoon, LuUsers } from 'react-icons/lu'
import type { TripSummary } from '../types/trip-types'
import './TripCard.css'

type Props = { trip: TripSummary; isPast?: boolean }

function calcDday(startDate: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'D-Day'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

function formatEndDate(endDate: string): string {
  return endDate.replace(/-/g, '.')
}

function calcDuration(startDate: string, endDate: string): string {
  const nights = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
  )
  return `${nights}박${nights + 1}일`
}

const VARIANT_COUNT = 5

export function TripCard({ trip, isPast = false }: Props) {
  const badge = isPast ? formatEndDate(trip.endDate) : calcDday(trip.startDate)
  const duration = calcDuration(trip.startDate, trip.endDate)
  const numericId = Number.parseInt(trip.id, 10)
  const variant = (Number.isNaN(numericId) ? 0 : numericId) % VARIANT_COUNT
  const status = trip.isPlanning ? '생성 중' : trip.fixed ? '확정' : '확정 전'

  return (
    <article
      className={clsx('trip-card', isPast && 'trip-card--past')}
      data-variant={isPast ? undefined : variant}
      aria-label={trip.name}
    >
      <div className="trip-card__overlay" aria-hidden="true" />
      <div className="trip-card__badges">
        <span
          className={clsx(
            'trip-card__status',
            trip.isPlanning && 'trip-card__status--planning',
            !trip.isPlanning && !trip.fixed && 'trip-card__status--draft',
          )}
        >
          {status}
        </span>
        <span className="trip-card__dday">{badge}</span>
      </div>
      <div className="trip-card__body">
        <div className="trip-card__title-row">
          <span className="trip-card__site">{trip.name}</span>
        </div>
        <div className="trip-card__meta">
          <span className="trip-card__meta-item">
            <LuMoon size={14} aria-hidden="true" />
            {duration}
          </span>
          <span className="trip-card__meta-item">
            <LuUsers size={14} aria-hidden="true" />
            {trip.personCount}명
          </span>
        </div>
      </div>
    </article>
  )
}
