import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LuArrowLeft, LuSparkles } from 'react-icons/lu'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { useTripPlans } from '@/features/trip/hooks/use-trip-plans'
import type { PlacePlan, PlaceType, Transport } from '@/features/trip/types/plan-types'
import './TripDetailPage.css'

// ── utils ────────────────────────────────────────────────────

const PLACE_TYPE_LABEL: Record<PlaceType, string> = {
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

// ── sub-components ───────────────────────────────────────────

function TransportRow({ transport }: { transport: Transport }) {
  return (
    <div className="detail-transport-row" aria-label="이동 정보">
      <div className="detail-transport-row__line" aria-hidden="true" />
      <span className="detail-transport-row__info">
        {formatDuration(transport.takeTime)} · {formatDistance(transport.totalDistanceMeters)}
      </span>
    </div>
  )
}

function PlaceCard({ plan, index }: { plan: PlacePlan; index: number }) {
  const { placeInfo } = plan
  return (
    <div className="detail-place-card">
      <div className="detail-place-card__num" aria-hidden="true">
        {index + 1}
      </div>
      <div className="detail-place-card__body">
        <span className="detail-place-card__name">{placeInfo.name}</span>
        <span className="detail-place-card__type">
          {PLACE_TYPE_LABEL[placeInfo.placeType] ?? placeInfo.placeType}
        </span>
      </div>
    </div>
  )
}

function MapPlaceholder({ tripName }: { tripName: string }) {
  return (
    <div className="detail-map-placeholder" aria-label="지도 영역">
      <span className="detail-map-placeholder__emoji" aria-hidden="true">🗺️</span>
      <span className="detail-map-placeholder__label">{tripName}</span>
    </div>
  )
}

// ── main ─────────────────────────────────────────────────────

export function TripDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)

  const { data: trips = [], isLoading: isTripsLoading } = useTrips()
  const trip = trips.find((t) => t.id === tripId)

  const { data: plans, isLoading: isPlansLoading, isError: isPlansError } = useTripPlans(
    trip?.tripThemeType ? tripId : undefined,
  )

  const selectedPlans: PlacePlan[] = useMemo(() => {
    if (!trip?.tripThemeType || !plans?.body) return []
    return plans.body[trip.tripThemeType] ?? []
  }, [trip, plans])

  const sortedDates = useMemo(() => getSortedDates(selectedPlans), [selectedPlans])
  const grouped    = useMemo(() => groupByDate(selectedPlans),     [selectedPlans])

  const plansForDay = useMemo(() => {
    const date = sortedDates[selectedDayIndex]
    if (!date) return []
    return sortByStartTime(grouped.get(date) ?? [])
  }, [grouped, sortedDates, selectedDayIndex])

  if (!tripId) {
    return (
      <main className="detail-page detail-page--state">
        <p>잘못된 여행 정보입니다.</p>
      </main>
    )
  }

  if (isTripsLoading) {
    return (
      <main className="detail-page detail-page--state">
        <p>여행 정보를 불러오는 중...</p>
      </main>
    )
  }

  if (!trip) {
    return (
      <main className="detail-page detail-page--state">
        <p>여행을 찾을 수 없어요.</p>
        <button type="button" className="detail-cta-btn" onClick={() => navigate('/trips')}>
          여행 목록으로
        </button>
      </main>
    )
  }

  return (
    <main className="detail-page">
      <header className="detail-header">
        <button
          type="button"
          className="detail-header__back"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
        >
          <LuArrowLeft className="detail-header__back-icon" aria-hidden="true" />
        </button>
        <h1 className="detail-header__title">{trip.name}</h1>
        <div className="detail-header__spacer" />
      </header>

      <div className="detail-feed">
        <div className="detail-map">
          <MapPlaceholder tripName={trip.name} />
        </div>

        <section className="detail-sheet" aria-label="여행 일정">
          <div className="detail-sheet__handle" aria-hidden="true" />

          {!trip.tripThemeType ? (
            <div className="detail-sheet__unconfirmed">
              <LuSparkles className="detail-sheet__unconfirmed-icon" aria-hidden="true" />
              <p className="detail-sheet__unconfirmed-text">
                아직 일정을 선택하지 않았어요.
                <br />
                AI가 추천하는 일정을 확인해보세요.
              </p>
              <button
                type="button"
                className="detail-cta-btn"
                onClick={() => navigate(`/trips/${tripId}/select`)}
              >
                일정 선택하기
              </button>
            </div>
          ) : isPlansLoading ? (
            <div className="detail-sheet__status">일정을 불러오는 중...</div>
          ) : isPlansError ? (
            <div className="detail-sheet__status detail-sheet__status--error">
              일정을 불러오지 못했어요.
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="detail-sheet__status">일정이 없습니다.</div>
          ) : (
            <>
              <nav className="detail-day-tabs" role="tablist" aria-label="날짜 선택">
                {sortedDates.map((date, i) => (
                  <button
                    key={date}
                    role="tab"
                    type="button"
                    aria-selected={i === selectedDayIndex}
                    className={`detail-day-tab${i === selectedDayIndex ? ' detail-day-tab--active' : ''}`}
                    onClick={() => setSelectedDayIndex(i)}
                  >
                    <span className="detail-day-tab__label">Day {i + 1}</span>
                    <span className="detail-day-tab__date">{formatDateLabel(date)}</span>
                  </button>
                ))}
              </nav>

              <div className="detail-schedule-list">
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
          )}
        </section>
      </div>
    </main>
  )
}
