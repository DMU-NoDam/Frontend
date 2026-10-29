import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { getNextFixedTrip, isTripActive } from '@/features/trip/lib/trip-date'
import { TripMapSheet } from '@/features/trip/components/TripMapSheet'
import { useThemeColor } from '@/shared/hooks/use-theme-color'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import './TripToolPage.css'

// Figma: 시트가 화면의 2/3 정도를 덮고 위에 날씨가 보인다
const SHEET_COLLAPSED_PCT = 64
const SHEET_EXPANDED_PCT = 90

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

  return (
    <main className="trip-tool-page">
      <TripMapSheet
        collapsedPct={SHEET_COLLAPSED_PCT}
        expandedPct={SHEET_EXPANDED_PCT}
        mapContent={<div className="trip-tool-page__hero" aria-hidden="true" />}
        sheetContent={() => (
          <div className="trip-tool-page__cards">
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
