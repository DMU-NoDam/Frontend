import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { getNextFixedTrip, isTripActive } from '@/features/trip/lib/trip-date'
import { TripMapSheet } from '@/features/trip/components/TripMapSheet'
import { WeatherHeader } from '@/features/tool/components/WeatherHeader'
import { ExchangeRateCard } from '@/features/tool/components/ExchangeRateCard'
import { getTripLocation } from '@/features/tool/lib/trip-location'
import { useThemeColor } from '@/shared/hooks/use-theme-color'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import './TripToolPage.css'

// Figma: 시트가 화면의 2/3 정도를 덮고 위에 날씨가 보인다
const SHEET_COLLAPSED_PCT = 64
const SHEET_EXPANDED_PCT = 90

// toISOString()은 UTC라 한국 시간 오전 9시 전에는 어제 날짜가 나온다
function getLocalToday(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function TripToolPage() {
  useThemeColor('#ff6f9f', '#ffffff')
  const navigate = useNavigate()
  const { data: trips = [], isLoading: isTripsLoading } = useTrips()

  // 홈과 같은 규칙: 진행 중인 확정 여행 → 없으면 가장 가까운 확정 여행
  const activeTrip = useMemo(
    () => trips.find((t) => t.fixed && isTripActive(t.startDate, t.endDate)),
    [trips],
  )
  const trip = activeTrip ?? getNextFixedTrip(trips)
  const location = trip ? getTripLocation(trip) : null
  const weatherDate = trip ? (activeTrip ? getLocalToday() : trip.startDate) : undefined

  return (
    <main className="trip-tool-page">
      <TripMapSheet
        collapsedPct={SHEET_COLLAPSED_PCT}
        expandedPct={SHEET_EXPANDED_PCT}
        mapContent={<div className="trip-tool-page__hero" aria-hidden="true" />}
        overlay={
          <WeatherHeader location={location} date={weatherDate} isTripsLoading={isTripsLoading} />
        }
        sheetContent={() => (
          <div className="trip-tool-page__cards">
            <ExchangeRateCard target={location?.currency ?? 'JPY'} />

            {!trip && !isTripsLoading && (
              <div className="trip-tool-page__empty">
                <p>확정된 여행이 있으면 메모장과 체크리스트를 쓸 수 있어요.</p>
                <button type="button" onClick={() => navigate('/trips')}>
                  내 여행 보러 가기
                </button>
              </div>
            )}
          </div>
        )}
      />

      <TabBar />
    </main>
  )
}
