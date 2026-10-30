import { lazy, Suspense, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { getUpcomingFixedTrips, isTripActive } from '@/features/trip/lib/trip-date'
import { TripMapSheet } from '@/features/trip/components/TripMapSheet'
import { WeatherHeader } from '@/features/tool/components/WeatherHeader'
import { TripSwitcher } from '@/features/tool/components/TripSwitcher'
import { ExchangeRateCard } from '@/features/tool/components/ExchangeRateCard'
import { MemoCard } from '@/features/tool/components/MemoCard'
import { ChecklistCard } from '@/features/tool/components/ChecklistCard'
import { WeatherScene } from '@/features/tool/components/weather-scene/WeatherScene'
import { useDayWeather } from '@/features/tool/hooks/use-weather'
import { getTripLocation } from '@/features/tool/lib/trip-location'
import { getWeatherScene, isWeatherScene, WEATHER_SCENE_TOP_COLOR } from '@/features/tool/lib/weather-scene'
import type { WeatherScene as Scene } from '@/features/tool/lib/weather-scene'
import { useThemeColor } from '@/shared/hooks/use-theme-color'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import './TripToolPage.css'

// 개발용 날씨 장면 선택기. 개발 서버에서만 불러와서 빌드에는 코드와 CSS가 포함되지 않는다
const WeatherScenePicker = import.meta.env.DEV
  ? lazy(() =>
      import('@/features/tool/components/weather-scene/WeatherScenePicker').then((m) => ({
        default: m.WeatherScenePicker,
      })),
    )
  : null

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
  const navigate = useNavigate()
  const { data: trips = [], isLoading: isTripsLoading } = useTrips()

  const [searchParams, setSearchParams] = useSearchParams()

  // 고를 수 있는 여행: 아직 끝나지 않은 확정 여행
  const upcomingTrips = useMemo(() => getUpcomingFixedTrips(trips), [trips])
  // 고른 여행(?trip=)이 없거나 목록에 없으면 홈과 같은 규칙: 진행 중인 확정 여행 → 가장 가까운 확정 여행
  const selectedTripId = searchParams.get('trip')
  const trip =
    upcomingTrips.find((t) => t.id === selectedTripId) ??
    upcomingTrips.find((t) => isTripActive(t.startDate, t.endDate)) ??
    upcomingTrips[0]
  const location = trip ? getTripLocation(trip) : null

  // 다른 query parameter(scene 등)는 그대로 둔다
  const updateSearchParam = (key: string, value: string | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }
  // 출발일이 멀어도 날씨를 보여주도록 항상 여행지의 오늘 날씨를 조회한다
  // (백엔드는 7일보다 먼 날짜에는 예보를 주지 않는다)
  const weatherDate = trip ? getLocalToday() : undefined

  // 헤더와 같은 조회라 react-query가 한 번만 요청한다
  const { day: weather } = useDayWeather(location?.cityName, weatherDate)

  // 개발용 장면 미리보기: /tools?scene=rain 처럼 주소로 장면을 고정한다 (빌드에서는 무시)
  const sceneParam = searchParams.get('scene')
  const previewScene = import.meta.env.DEV && isWeatherScene(sceneParam) ? sceneParam : null
  const setPreviewScene = (next: Scene | null) => updateSearchParam('scene', next)

  const scene = previewScene ?? (weather ? getWeatherScene(weather.weatherCode) : null)
  // 상태바 색을 배경 장면의 하늘 색과 이어지게 한다 (날씨가 없으면 기본 분홍)
  useThemeColor(scene ? WEATHER_SCENE_TOP_COLOR[scene] : '#ff6f9f', '#ffffff')

  return (
    <main className="trip-tool-page">
      <TripMapSheet
        collapsedPct={SHEET_COLLAPSED_PCT}
        expandedPct={SHEET_EXPANDED_PCT}
        mapContent={
          scene ? <WeatherScene scene={scene} /> : <div className="trip-tool-page__hero" aria-hidden="true" />
        }
        overlay={
          <>
            <WeatherHeader
              location={location}
              tripSwitcher={
                trip && (
                  <TripSwitcher
                    trips={upcomingTrips}
                    selected={trip}
                    onSelect={(tripId) => updateSearchParam('trip', tripId)}
                  />
                )
              }
              date={weatherDate}
              isTripsLoading={isTripsLoading}
            />
            {WeatherScenePicker && (
              <Suspense fallback={null}>
                <WeatherScenePicker value={previewScene} onChange={setPreviewScene} />
              </Suspense>
            )}
          </>
        }
        sheetContent={() => (
          <div className="trip-tool-page__cards">
            <ExchangeRateCard target={location?.currency ?? 'JPY'} />

            {trip ? (
              <>
                <MemoCard tripId={trip.id} />
                {/* 여행을 바꾸면 입력 중이던 준비물도 비운다 */}
                <ChecklistCard key={trip.id} tripId={trip.id} />
              </>
            ) : (
              !isTripsLoading && (
                <div className="trip-tool-page__empty">
                  <p>확정된 여행이 있으면 메모장과 체크리스트를 쓸 수 있어요.</p>
                  <button type="button" onClick={() => navigate('/trips')}>
                    내 여행 보러 가기
                  </button>
                </div>
              )
            )}
          </div>
        )}
      />

      <TabBar />
    </main>
  )
}
