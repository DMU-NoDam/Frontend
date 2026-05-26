import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { LuArrowLeft, LuExternalLink, LuSparkles } from 'react-icons/lu'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { useTripPlans } from '@/features/trip/hooks/use-trip-plans'
import {
  getDdayLabel,
  getNextFixedTrip,
  isTripActive,
} from '@/features/trip/lib/trip-date'
import type { PlacePlan } from '@/features/trip/types/plan-types'
import type { TripSummary } from '@/features/trip/types/trip-types'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import { TravelHero } from './TravelHero'
import './DashboardPage.css'

const COLLAPSED = 60
const EXPANDED = 100
const SNAP_MID = (COLLAPSED + EXPANDED) / 2

const DESTINATIONS = [
  {
    emoji: '🗼',
    city: '파리',
    country: 'France',
    color: '#ffecd2',
    url: 'https://www.google.com/intl/ko/maps/about/behind-the-scenes/streetview/treks/eiffel-tower/',
  },
  {
    emoji: '🗻',
    city: '도쿄',
    country: 'Japan',
    color: '#d4f1f4',
    url: 'https://www.google.com/intl/ko/maps/about/behind-the-scenes/streetview/treks/mount-fuji/',
  },
  {
    emoji: '🚤',
    city: '베네치아',
    country: 'Italy',
    color: '#fde2e4',
    url: 'https://www.google.com/intl/ko/maps/about/behind-the-scenes/streetview/treks/venice/',
  },
  {
    emoji: '🏜️',
    city: '미국',
    country: 'USA',
    color: '#e2f0cb',
    url: 'https://www.google.com/intl/ko/maps/about/behind-the-scenes/streetview/treks/grand-canyon/',
  },
]

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function sortByStartTime(plans: PlacePlan[]): PlacePlan[] {
  return [...plans].sort((a, b) => a.startTime.localeCompare(b.startTime))
}

// ── Sub-components ───────────────────────────────────────────

function DashboardMapPlaceholder({ trip }: { trip: TripSummary }) {
  return (
    <div className="home-map-placeholder" aria-label="지도 영역">
      <span className="home-map-placeholder__emoji" aria-hidden="true">
        🗺️
      </span>
      <span className="home-map-placeholder__name">{trip.name}</span>
      <span className="home-map-placeholder__badge">여행 중</span>
    </div>
  )
}

function TripPreviewCard({
  trip,
  onClick,
}: {
  trip: TripSummary
  onClick: () => void
}) {
  const dday = getDdayLabel(trip.startDate)
  const nights = Math.round(
    (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  )
  return (
    <button type="button" className="home-trip-preview" onClick={onClick} aria-label={trip.name}>
      <div className="home-trip-preview__dday">{dday}</div>
      <div className="home-trip-preview__name">{trip.name}</div>
      <div className="home-trip-preview__meta">
        {nights}박{nights + 1}일 · {trip.personCount}명
      </div>
      <div className="home-trip-preview__cta">일정 보기 →</div>
    </button>
  )
}

function TodayScheduleContent({
  tripId,
  themeType,
}: {
  tripId: string
  themeType: TripSummary['tripThemeType']
}) {
  const { data: plans, isLoading, isError } = useTripPlans(tripId)

  const todayPlans = useMemo<PlacePlan[]>(() => {
    if (!plans?.body || !themeType) return []
    const all = plans.body[themeType] ?? []
    const today = getTodayString()
    return sortByStartTime(all.filter((p) => p.date === today))
  }, [plans, themeType])

  if (isLoading) return <p className="home-today__status">일정 불러오는 중...</p>
  if (isError) return <p className="home-today__status">일정을 불러오지 못했어요.</p>
  if (todayPlans.length === 0)
    return <p className="home-today__status">오늘 일정이 없어요.</p>

  return (
    <ul className="home-today__list" aria-label="오늘 일정">
      {todayPlans.map((plan, i) => (
        <li key={plan.id} className="home-today__item">
          <span className="home-today__num" aria-hidden="true">
            {i + 1}
          </span>
          <div className="home-today__info">
            <span className="home-today__place">{plan.placeInfo.name}</span>
            <span className="home-today__time">{plan.placeInfo.address}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Main component ────────────────────────────────────────────

export function UserDashboard() {
  const navigate = useNavigate()
  const { data: trips = [], isLoading: isTripsLoading } = useTrips()
  const [isExpanded, setIsExpanded] = useState(false)
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null)
  const [iframeBlocked, setIframeBlocked] = useState(false)

  const activeTrip = useMemo(
    () => trips.find((t) => t.fixed && isTripActive(t.startDate, t.endDate)),
    [trips],
  )
  const upcomingTrip = useMemo(
    () => (activeTrip ? undefined : getNextFixedTrip(trips)),
    [activeTrip, trips],
  )

  const headerMessage = isTripsLoading
    ? '여행 일정을 확인하고 있어요'
    : activeTrip
    ? `${activeTrip.name} 여행 중 🗺️`
    : upcomingTrip
    ? `${upcomingTrip.name} ${getDdayLabel(upcomingTrip.startDate)}`
    : trips.length === 0
    ? '여행을 계획해보세요'
    : '일정을 확정해주세요'

  const height = useMotionValue(COLLAPSED)
  const heightPct = useTransform(height, (v) => `${v}%`)
  const popularMaxHeight = useTransform(height, [SNAP_MID, EXPANDED], ['0px', '200px'])
  const popularOpacity = useTransform(height, [SNAP_MID, EXPANDED], [0, 1])

  const isDragging = useRef(false)
  const startY = useRef(0)
  const startH = useRef(COLLAPSED)

  function startDrag(e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    startY.current = e.clientY
    startH.current = height.get()
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    startDrag(e)
  }

  function onEmptyPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return
    startDrag(e)
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!isDragging.current) return
    const feed = e.currentTarget.closest('.home-feed') as HTMLElement | null
    const feedH = feed?.clientHeight ?? 500
    const dy = startY.current - e.clientY
    const delta = (dy / feedH) * 100
    const next = Math.max(COLLAPSED, Math.min(EXPANDED, startH.current + delta))
    height.set(next)
  }

  function onPointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    const target = height.get() >= SNAP_MID ? EXPANDED : COLLAPSED
    setIsExpanded(target === EXPANDED)
    animate(height, target, { type: 'spring', stiffness: 280, damping: 50 })
  }

  function openDest(url: string | null) {
    if (!url) return
    setIframeBlocked(false)
    setWebViewUrl(url)
  }

  function closeWebView() {
    setWebViewUrl(null)
    setIframeBlocked(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <span className="home-header__badge">✈️ {headerMessage}</span>
      </header>

      <div className="home-feed">
        <div className="home-map">
          {activeTrip ? (
            <DashboardMapPlaceholder trip={activeTrip} />
          ) : upcomingTrip ? (
            <TripPreviewCard
              trip={upcomingTrip}
              onClick={() => navigate(`/trips/${upcomingTrip.id}/detail`)}
            />
          ) : (
            <TravelHero />
          )}
        </div>

        <motion.section
          className="home-trips"
          aria-label="내 여행"
          style={{ height: heightPct }}
        >
          <button
            type="button"
            className="home-trips__handle-btn"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? '여행 목록 접기' : '여행 목록 펼치기'}
          >
            <div className="home-trips__handle" aria-hidden="true" />
          </button>

          {activeTrip ? (
            <div
              className="home-trips__today"
              onPointerDown={onEmptyPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <h2 className="home-trips__today-title">오늘 일정</h2>
              <TodayScheduleContent
                tripId={activeTrip.id}
                themeType={activeTrip.tripThemeType}
              />
              <button
                type="button"
                className="home-trips__make-btn"
                style={{ marginTop: 'auto' }}
                onClick={() => navigate('/trips/create')}
              >
                <LuSparkles className="home-trips__make-icon" aria-hidden="true" />
                나만의 일정 만들기
              </button>
            </div>
          ) : (
            <div
              className="home-trips__empty"
              onPointerDown={onEmptyPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div className="home-trips__hero">
                <h2 className="home-trips__empty-title">
                  AI 여행 플랜을
                  <br />
                  시작하기
                </h2>
                <button
                  type="button"
                  className="home-trips__make-btn"
                  onClick={() => navigate('/trips/create')}
                >
                  <LuSparkles className="home-trips__make-icon" aria-hidden="true" />
                  나만의 일정 만들기
                </button>
              </div>

              <motion.section
                className="home-trips__popular"
                style={{ maxHeight: popularMaxHeight, opacity: popularOpacity }}
              >
                <h3 className="home-trips__popular-title">인기 여행지</h3>
                <div className="home-trips__popular-list">
                  {DESTINATIONS.map(({ emoji, city, country, color, url }) => (
                    <button
                      key={city}
                      type="button"
                      className="home-trips__dest-card"
                      style={{ background: color }}
                      onClick={() => openDest(url)}
                    >
                      <span className="home-trips__dest-emoji">{emoji}</span>
                      <span className="home-trips__dest-city">{city}</span>
                      <span className="home-trips__dest-country">{country}</span>
                    </button>
                  ))}
                </div>
              </motion.section>
            </div>
          )}
        </motion.section>
      </div>

      <TabBar />

      {webViewUrl && (
        <div className="webview-overlay">
          <div className="webview-topbar">
            <button
              type="button"
              className="webview-back-btn"
              onClick={closeWebView}
              aria-label="홈으로 돌아가기"
            >
              <LuArrowLeft className="webview-back-icon" aria-hidden="true" />
              돌아가기
            </button>
          </div>

          {iframeBlocked ? (
            <div className="webview-blocked">
              <p className="webview-blocked-msg">이 페이지는 미리보기를 지원하지 않아요.</p>
              <a
                href={webViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="webview-open-btn"
              >
                <LuExternalLink aria-hidden="true" />
                브라우저에서 열기
              </a>
            </div>
          ) : (
            <iframe
              key={webViewUrl}
              src={webViewUrl}
              className="webview-frame"
              title="여행지 탐색"
              onError={() => setIframeBlocked(true)}
            />
          )}
        </div>
      )}
    </main>
  )
}
