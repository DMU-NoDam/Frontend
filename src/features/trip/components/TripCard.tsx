import clsx from 'clsx'
import { getCityPhoto } from '../lib/city-photo'
import { getTripDestination } from '../lib/city-airport'
import { getDdayLabel, isTripActive } from '../lib/trip-date'
import type { TripSummary } from '../types/trip-types'
import './TripCard.css'

type Props = { trip: TripSummary; isPast?: boolean }

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 'yyyy-MM-dd' → '11.02(월)'. new Date('yyyy-MM-dd')는 UTC로 읽혀 요일이 밀릴 수 있어 연·월·일로 만든다
function formatDayWithWeekday(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()]
  return `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}(${weekday})`
}

// 'yyyy-MM-dd' → '11.02'
function formatMonthDay(date: string): string {
  const [, month, day] = date.split('-')
  return `${month}.${day}`
}

// 출발일이면 '오늘 출발', 여행 중이면 '여행 중', 아니면 D-day
function getDepartureLabel(trip: TripSummary): string {
  const dday = getDdayLabel(trip.startDate)
  if (dday === 'D-Day') return '오늘 출발'
  return isTripActive(trip.startDate, trip.endDate) ? '여행 중' : dday
}

// 여행 카드 : 홈 스크랩북과 같은 탑승권 모양.
// 왼쪽 도시 사진 | 여행 이름 · ICN → 도착 공항 · 날짜 · D-day | 절취선 오른쪽에 출발일과 확정 여부
export function TripCard({ trip, isPast = false }: Props) {
  const photo = getCityPhoto(trip)
  const destination = getTripDestination(trip)
  const status = isPast ? '다녀옴' : trip.fixed ? '✓ 확정' : '확정 전'
  const departure = isPast ? null : getDepartureLabel(trip)

  return (
    <article className={clsx('trip-card', isPast && 'trip-card--past')} aria-label={trip.name}>
      <div className="trip-card__photo">
        {photo && <img src={photo} alt="" loading="lazy" decoding="async" />}
      </div>

      <div className="trip-card__main">
        <span className="trip-card__name">{trip.name}</span>
        {destination?.airport ? (
          <span className="trip-card__route">
            ICN <span className="trip-card__arrow">→</span> {destination.airport}
          </span>
        ) : (
          // 공항을 모르는 도시는 공항 코드 대신 도시 이름을 적는다
          <span className="trip-card__route trip-card__route--city">
            ICN <span className="trip-card__arrow">→</span> {destination?.cityName ?? trip.name}
          </span>
        )}
        <span className="trip-card__period">
          {formatDayWithWeekday(trip.startDate)} – {formatDayWithWeekday(trip.endDate)}
        </span>
        {departure && (
          <span className={clsx('trip-card__dday', departure === '오늘 출발' && 'trip-card__dday--today')}>
            {departure}
          </span>
        )}
      </div>

      <div className="trip-card__stub">
        <small>DEP</small>
        <b>{formatMonthDay(trip.startDate)}</b>
        <span className={clsx('trip-card__status', !trip.fixed && !isPast && 'trip-card__status--draft')}>
          {status}
        </span>
      </div>
    </article>
  )
}
