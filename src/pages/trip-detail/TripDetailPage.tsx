import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LuArrowLeft, LuSparkles } from 'react-icons/lu'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { useTripPlans } from '@/features/trip/hooks/use-trip-plans'
import { useUpdateTripFixed } from '@/features/trip/hooks/use-update-trip-fixed'
import { TripMapSheet, MapPlaceholder } from '@/features/trip/components/TripMapSheet'
import { TripScheduleView } from '@/features/trip/components/TripScheduleView'
import type { PlacePlan } from '@/features/trip/types/plan-types'
import './TripDetailPage.css'

export function TripDetailPage() {
  const { tripId } = useParams()
  const navigate   = useNavigate()

  const updateTripFixedMutation = useUpdateTripFixed()

  const { data: trips = [], isLoading: isTripsLoading } = useTrips()
  const trip = trips.find((t) => t.id === tripId)

  const { data: plans, isLoading: isPlansLoading, isError: isPlansError } = useTripPlans(
    trip?.tripThemeType ? tripId : undefined,
  )

  const selectedPlans: PlacePlan[] = useMemo(() => {
    if (!trip?.tripThemeType || !plans?.body) return []
    return plans.body[trip.tripThemeType] ?? []
  }, [trip, plans])

  const handleToggleFixed = () => {
    if (!tripId || !trip) return
    updateTripFixedMutation.mutate({ tripId, fixed: !trip.fixed })
  }

  const handleBack = () => {
    if (trip?.tripThemeType) {
      navigate('/trips')
      return
    }
    navigate(-1)
  }

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
          onClick={handleBack}
          aria-label="뒤로 가기"
        >
          <LuArrowLeft className="detail-header__back-icon" aria-hidden="true" />
        </button>
        <h1 className="detail-header__title">{trip.name}</h1>
        <button
          type="button"
          className={`detail-header__fixed-btn${trip.fixed ? ' detail-header__fixed-btn--active' : ''}`}
          onClick={handleToggleFixed}
          disabled={updateTripFixedMutation.isPending}
        >
          {trip.fixed ? '확정 취소' : '일정 확정'}
        </button>
      </header>

      <TripMapSheet
        mapContent={<MapPlaceholder label={trip.name} />}
        sheetContent={() => {
          if (!trip.tripThemeType) {
            return (
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
            )
          }
          if (isPlansLoading) {
            return <div className="detail-sheet__status">일정을 불러오는 중...</div>
          }
          if (isPlansError) {
            return (
              <div className="detail-sheet__status detail-sheet__status--error">
                일정을 불러오지 못했어요.
              </div>
            )
          }
          return <TripScheduleView plans={selectedPlans} />
        }}
      />
    </main>
  )
}
