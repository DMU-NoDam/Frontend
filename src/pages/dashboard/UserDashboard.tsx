import { useMemo, useState } from 'react'
import { useCurrentLocation } from '@/shared/hooks/use-current-location'
import { useThemeColor } from '@/shared/hooks/use-theme-color'
import { useNavigate } from 'react-router-dom'
import { motion, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { LuArrowLeft, LuExternalLink, LuSparkles } from 'react-icons/lu'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { useTripPlans } from '@/features/trip/hooks/use-trip-plans'
import {
  getDdayLabel,
  getNextFixedTrip,
  isTripActive,
} from '@/features/trip/lib/trip-date'
import {
  TripMapSheet,
  MapPlaceholder,
  SHEET_SNAP_MID,
  SHEET_EXPANDED,
} from '@/features/trip/components/TripMapSheet'
import { TripRouteMap } from '@/features/trip/components/TripRouteMap'
import { TripScheduleView } from '@/features/trip/components/TripScheduleView'
import type { PlacePlan } from '@/features/trip/types/plan-types'
import type { TripSummary } from '@/features/trip/types/trip-types'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import { TravelHero } from './TravelHero'
import './DashboardPage.css'

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

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

// ── Sub-components ───────────────────────────────────────────

function DashboardScheduleContent({
  themeType,
  plans,
  isLoading,
  isError,
  initialDate,
  selectedDate,
  onDateChange,
  onPlaceClick,
  focusedPlanId,
  onTransportClick,
  focusedTransportId,
}: {
  themeType: TripSummary['tripThemeType']
  plans: PlacePlan[]
  isLoading: boolean
  isError: boolean
  initialDate?: string
  selectedDate?: string
  onDateChange?: (date: string) => void
  onPlaceClick?: (plan: PlacePlan) => void
  focusedPlanId?: number | null
  onTransportClick?: (transportId: number) => void
  focusedTransportId?: number | null
}) {
  if (!themeType) return <p className="home-schedule__status">선택된 일정이 없어요.</p>
  if (isLoading)  return <p className="home-schedule__status">일정을 불러오는 중...</p>
  if (isError)    return <p className="home-schedule__status">일정을 불러오지 못했어요.</p>

  return (
    <TripScheduleView
      plans={plans}
      initialDate={initialDate}
      selectedDate={selectedDate}
      onDateChange={onDateChange}
      onPlaceClick={onPlaceClick}
      focusedPlanId={focusedPlanId}
      onTransportClick={onTransportClick}
      focusedTransportId={focusedTransportId}
      emptyMessage="일정이 없습니다."
    />
  )
}

function ScheduleSheetContent({
  fixedTrip,
  activeTrip,
  plans,
  isLoading,
  isError,
  selectedDate,
  onDateChange,
  onPlaceClick,
  focusedPlanId,
  onTransportClick,
  focusedTransportId,
}: {
  fixedTrip: TripSummary
  activeTrip: TripSummary | undefined
  plans: PlacePlan[]
  isLoading: boolean
  isError: boolean
  selectedDate?: string
  onDateChange?: (date: string) => void
  onPlaceClick?: (plan: PlacePlan) => void
  focusedPlanId?: number | null
  onTransportClick?: (transportId: number) => void
  focusedTransportId?: number | null
}) {
  return (
    <div className="home-schedule">
      <DashboardScheduleContent
        themeType={fixedTrip.tripThemeType}
        plans={plans}
        isLoading={isLoading}
        isError={isError}
        initialDate={activeTrip ? getTodayString() : undefined}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        onPlaceClick={onPlaceClick}
        focusedPlanId={focusedPlanId}
        onTransportClick={onTransportClick}
        focusedTransportId={focusedTransportId}
      />
    </div>
  )
}

function EmptySheetContent({
  motionHeight,
  onCreateTrip,
  onOpenDest,
}: {
  motionHeight: MotionValue<number>
  onCreateTrip: () => void
  onOpenDest: (url: string) => void
}) {
  const popularMaxHeight = useTransform(motionHeight, [SHEET_SNAP_MID, SHEET_EXPANDED], ['0px', '200px'])
  const popularOpacity   = useTransform(motionHeight, [SHEET_SNAP_MID, SHEET_EXPANDED], [0, 1])

  return (
    <div className="home-trips__empty">
      <div className="home-trips__hero">
        <h2 className="home-trips__empty-title">
          AI 여행 플랜을
          <br />
          시작하기
        </h2>
        <button type="button" className="home-trips__make-btn" onClick={onCreateTrip}>
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
              onClick={() => onOpenDest(url)}
            >
              <span className="home-trips__dest-emoji">{emoji}</span>
              <span className="home-trips__dest-city">{city}</span>
              <span className="home-trips__dest-country">{country}</span>
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function UserDashboard() {
  useThemeColor('#ffb3cc', '#ffffff')
  const navigate = useNavigate()
  const { data: trips = [], isLoading: isTripsLoading } = useTrips()
  const [webViewUrl, setWebViewUrl]       = useState<string | null>(null)
  const [iframeBlocked, setIframeBlocked] = useState(false)

  const activeTrip = useMemo(
    () => trips.find((t) => t.fixed && isTripActive(t.startDate, t.endDate)),
    [trips],
  )
  const upcomingTrip = useMemo(
    () => (activeTrip ? undefined : getNextFixedTrip(trips)),
    [activeTrip, trips],
  )
  const fixedTrip = activeTrip ?? upcomingTrip

  // ── Current location — only while activeTrip is ongoing ──
  const { position: currentLocation } = useCurrentLocation({
    enabled: !!activeTrip,
  })

  // ── Plan data (lifted from DashboardScheduleContent) ─────
  const { data: plansData, isLoading: isPlansLoading, isError: isPlansError } =
    useTripPlans(fixedTrip?.id)

  const fixedPlans: PlacePlan[] = useMemo(() => {
    if (!fixedTrip?.tripThemeType || !plansData?.body) return []
    return plansData.body[fixedTrip.tripThemeType] ?? []
  }, [fixedTrip, plansData])

  // ── Shared map/schedule state ─────────────────────────────
  const tripDates = useMemo(
    () => [...new Set(fixedPlans.map((p) => p.date))].sort(),
    [fixedPlans],
  )

  // User's explicit date choice (null = use default)
  const [userSelectedDate, setUserSelectedDate] = useState<string | null>(null)

  const selectedDate = useMemo(() => {
    if (userSelectedDate && tripDates.includes(userSelectedDate)) return userSelectedDate
    if (activeTrip) {
      const today = getTodayString()
      return tripDates.includes(today) ? today : (tripDates[0] ?? null)
    }
    return tripDates[0] ?? null
  }, [userSelectedDate, tripDates, activeTrip])

  const [focusedPlanId, setFocusedPlanId]           = useState<number | null>(null)
  const [focusedTransportId, setFocusedTransportId] = useState<number | null>(null)

  // ── Header message ────────────────────────────────────────
  const headerMessage = isTripsLoading
    ? '여행 일정을 확인하고 있어요'
    : activeTrip
    ? `${activeTrip.name} 여행 중 🗺️`
    : upcomingTrip
    ? `${upcomingTrip.name} ${getDdayLabel(upcomingTrip.startDate)}`
    : trips.length === 0
    ? '여행을 계획해보세요'
    : '일정을 확정해주세요'

  function openDest(url: string) {
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
      <TripMapSheet
        mapContent={
          fixedTrip
            ? fixedPlans.length > 0
              ? (
                <TripRouteMap
                  plans={fixedPlans}
                  selectedDate={selectedDate}
                  focusedPlanId={focusedPlanId}
                  onMarkerClick={(planId) => { setFocusedPlanId(planId); setFocusedTransportId(null) }}
                  currentLocation={currentLocation}
                  highlightedTransportId={focusedTransportId}
                />
              )
              : <MapPlaceholder />
            : <TravelHero />
        }
        overlay={
          <div className="home-map-overlay">
            <span className="home-header__badge">✈️ {headerMessage}</span>
          </div>
        }
        sheetContent={(motionHeight) =>
          fixedTrip ? (
            <ScheduleSheetContent
              fixedTrip={fixedTrip}
              activeTrip={activeTrip}
              plans={fixedPlans}
              isLoading={isPlansLoading}
              isError={isPlansError}
              selectedDate={selectedDate ?? undefined}
              onDateChange={(date) => { setUserSelectedDate(date); setFocusedPlanId(null); setFocusedTransportId(null) }}
              onPlaceClick={(plan) => { setFocusedPlanId(plan.id); setFocusedTransportId(null) }}
              focusedPlanId={focusedPlanId}
              onTransportClick={(id) => setFocusedTransportId((prev) => (prev === id ? null : id))}
              focusedTransportId={focusedTransportId}
            />
          ) : (
            <EmptySheetContent
              motionHeight={motionHeight}
              onCreateTrip={() => navigate('/trips/create')}
              onOpenDest={openDest}
            />
          )
        }
      />

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
