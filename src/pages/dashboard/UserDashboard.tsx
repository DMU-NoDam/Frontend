import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuCalendarDays, LuMapPin, LuSparkles } from 'react-icons/lu'
import { useTripPlans } from '@/features/trip/hooks/use-trip-plans'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { formatLocalTime, groupPlansByDate } from '@/features/trip/lib/plan-group'
import { getDdayLabel, getNextFixedTrip, isTripActive } from '@/features/trip/lib/trip-date'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import { TravelHero } from './TravelHero'
import './DashboardPage.css'

function todayDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function UserDashboard() {
  const navigate = useNavigate()
  const { data: trips = [], isLoading } = useTrips()
  const nextFixedTrip = useMemo(() => getNextFixedTrip(trips), [trips])
  const isActiveTrip = nextFixedTrip
    ? isTripActive(nextFixedTrip.startDate, nextFixedTrip.endDate)
    : false
  const { data: plans } = useTripPlans(isActiveTrip ? nextFixedTrip?.id : undefined)

  const activePlans = nextFixedTrip?.tripThemeType
    ? plans?.body[nextFixedTrip.tripThemeType] ?? []
    : []
  const dayGroups = useMemo(() => groupPlansByDate(activePlans), [activePlans])
  const todayGroup =
    dayGroups.find((group) => group.date === todayDateString()) ?? dayGroups[0]
  const previewPlans = todayGroup?.plans.slice(0, 3) ?? []

  const headerMessage = isLoading
    ? '여행 일정을 확인하고 있어요'
    : nextFixedTrip
    ? `${nextFixedTrip.name} ${getDdayLabel(nextFixedTrip.startDate)}`
    : '일정을 확정해주세요'

  return (
    <main className="home-page">
      <header className="home-header">
        <span className="home-header__badge">{headerMessage}</span>
      </header>

      <div className="home-feed">
        <section className="home-map" aria-label={isActiveTrip ? '현재 여행 지도' : '여행 프리뷰'}>
          {isActiveTrip ? (
            <div className="home-map-preview">
              <div className="home-map-preview__grid" aria-hidden="true" />
              <LuMapPin className="home-map-preview__pin home-map-preview__pin--one" />
              <LuMapPin className="home-map-preview__pin home-map-preview__pin--two" />
              <span className="home-map-preview__current" aria-label="현재 위치 placeholder" />
            </div>
          ) : nextFixedTrip ? (
            <button
              type="button"
              className="home-trip-preview"
              onClick={() => navigate(`/trips/${nextFixedTrip.id}/detail`)}
            >
              <span className="home-trip-preview__label">다가오는 확정 여행</span>
              <strong className="home-trip-preview__name">{nextFixedTrip.name}</strong>
              <span className="home-trip-preview__date">
                {nextFixedTrip.startDate} - {nextFixedTrip.endDate}
              </span>
            </button>
          ) : (
            <TravelHero />
          )}
        </section>

        <section className="home-trips home-trips--static" aria-label="여행 일정">
          <div className="home-trips__handle" aria-hidden="true" />

          {isActiveTrip && nextFixedTrip ? (
            <div className="home-active-trip">
              <div className="home-active-trip__head">
                <div>
                  <p className="home-active-trip__eyebrow">오늘 일정</p>
                  <h2 className="home-active-trip__title">{nextFixedTrip.name}</h2>
                </div>
                <button
                  type="button"
                  className="home-active-trip__detail"
                  onClick={() => navigate(`/trips/${nextFixedTrip.id}/detail`)}
                >
                  상세
                </button>
              </div>

              <div className="home-active-trip__list">
                {previewPlans.length > 0 ? (
                  previewPlans.map((plan) => (
                    <article key={plan.id} className="home-active-trip__item">
                      <span className="home-active-trip__time">
                        {formatLocalTime(plan.startTime)}
                      </span>
                      <span className="home-active-trip__place">장소 #{plan.placeId}</span>
                    </article>
                  ))
                ) : (
                  <p className="home-active-trip__empty">표시할 일정이 없습니다.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="home-trips__empty home-trips__empty--static">
              <div className="home-trips__hero">
                {nextFixedTrip && (
                  <button
                    type="button"
                    className="home-trips__preview-cta"
                    onClick={() => navigate(`/trips/${nextFixedTrip.id}/detail`)}
                  >
                    <LuCalendarDays aria-hidden="true" />
                    확정 여행 상세 보기
                  </button>
                )}
                <h2 className="home-trips__empty-title">AI 여행 플랜을 시작해보세요</h2>
                <button
                  type="button"
                  className="home-trips__make-btn"
                  onClick={() => navigate('/trips/create')}
                >
                  <LuSparkles className="home-trips__make-icon" aria-hidden="true" />
                  나만의 일정 만들기
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <TabBar />
    </main>
  )
}
