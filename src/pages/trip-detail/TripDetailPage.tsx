import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LuArrowLeft, LuSparkles } from 'react-icons/lu'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { useTripPlans } from '@/features/trip/hooks/use-trip-plans'
import { useUpdateTripFixed } from '@/features/trip/hooks/use-update-trip-fixed'
import { useUpdateTrip } from '@/features/trip/hooks/use-update-trip'
import { useRecommendPlace } from '@/features/trip/hooks/use-recommend-place'
import { useReplacePlacePlan } from '@/features/trip/hooks/use-replace-place-plan'
import { useDeletePlacePlan } from '@/features/trip/hooks/use-delete-place-plan'
import { TripMapSheet, MapPlaceholder } from '@/features/trip/components/TripMapSheet'
import { TripRouteMap } from '@/features/trip/components/TripRouteMap'
import { TripScheduleView } from '@/features/trip/components/TripScheduleView'
import { PlaceRecommendSheet } from '@/features/trip/components/PlaceRecommendSheet'
import type { PlacePlan, RecommendedPlaceItem } from '@/features/trip/types/plan-types'
import type { TripSummary } from '@/features/trip/types/trip-types'
import { useThemeColor } from '@/shared/hooks/use-theme-color'
import './TripDetailPage.css'

function toDateKey(date: string) {
  return date.slice(0, 10)
}

function isDateRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  return toDateKey(startA) <= toDateKey(endB) && toDateKey(startB) <= toDateKey(endA)
}

export function TripDetailPage() {
  useThemeColor('#e8edf5', '#e8edf5')
  const { tripId } = useParams()
  const navigate   = useNavigate()

  const updateTripFixedMutation = useUpdateTripFixed()
  const updateTripMutation      = useUpdateTrip()
  const recommendMutation       = useRecommendPlace()
  const replaceMutation         = useReplacePlacePlan(tripId)
  const deleteMutation          = useDeletePlacePlan(tripId)

  const { data: trips = [], isLoading: isTripsLoading } = useTrips()
  const trip = trips.find((t) => t.id === tripId)

  const { data: plans, isLoading: isPlansLoading, isError: isPlansError } = useTripPlans(
    trip?.tripThemeType ? tripId : undefined,
  )

  const selectedPlans: PlacePlan[] = useMemo(() => {
    if (!trip?.tripThemeType || !plans?.body) return []
    return plans.body[trip.tripThemeType] ?? []
  }, [trip, plans])

  const planDates = useMemo(
    () => [...new Set(selectedPlans.map((p) => p.date))].sort(),
    [selectedPlans],
  )

  const [editMode, setEditMode]                           = useState(false)
  const [nameInput, setNameInput]                         = useState(trip?.name ?? '')
  const [personCountInput, setPersonCountInput]           = useState(String(trip?.personCount ?? ''))
  const [headerError, setHeaderError]                     = useState<string | null>(null)

  // Sync inputs when server data changes — React "storing previous renders" pattern, only outside edit mode
  const [prevServerName, setPrevServerName]   = useState(trip?.name)
  const [prevServerCount, setPrevServerCount] = useState(trip?.personCount)
  if (!editMode && trip?.name !== prevServerName) {
    setPrevServerName(trip?.name)
    setNameInput(trip?.name ?? '')
  }
  if (!editMode && trip?.personCount !== prevServerCount) {
    setPrevServerCount(trip?.personCount)
    setPersonCountInput(String(trip?.personCount ?? ''))
  }

  const [userSelectedDate, setUserSelectedDate]           = useState<string | null>(null)
  const [focusedPlanId, setFocusedPlanId]                 = useState<number | null>(null)
  const [focusedTransportId, setFocusedTransportId]       = useState<number | null>(null)
  const [editingPlanId, setEditingPlanId]                 = useState<number | null>(null)
  const [showRecommendSheet, setShowRecommendSheet]       = useState(false)
  const [recommendations, setRecommendations]             = useState<RecommendedPlaceItem[]>([])
  const [selectedRecommendIndex, setSelectedRecommendIndex] = useState(0)
  const [recommendTarget, setRecommendTarget]             = useState<PlacePlan | null>(null)
  const [conflictFixedTrips, setConflictFixedTrips]       = useState<TripSummary[]>([])
  const [conflictError, setConflictError]                 = useState<string | null>(null)

  const selectedDate = useMemo(
    () =>
      userSelectedDate && planDates.includes(userSelectedDate)
        ? userSelectedDate
        : (planDates[0] ?? null),
    [userSelectedDate, planDates],
  )

  const handleToggleFixed = () => {
    if (!tripId || !trip) return
    if (trip.fixed) {
      updateTripFixedMutation.mutate({ tripId, fixed: false })
      return
    }

    const overlappingFixedTrips = trips.filter((t) =>
      t.fixed &&
      t.id !== trip.id &&
      isDateRangeOverlapping(trip.startDate, trip.endDate, t.startDate, t.endDate)
    )

    if (overlappingFixedTrips.length > 0) {
      setConflictError(null)
      setConflictFixedTrips(overlappingFixedTrips)
      return
    }

    updateTripFixedMutation.mutate({ tripId, fixed: true })
  }

  const handleCloseConflictModal = () => {
    if (updateTripFixedMutation.isPending) return
    setConflictFixedTrips([])
    setConflictError(null)
  }

  const handleConfirmConflictFixed = async () => {
    if (!tripId || conflictFixedTrips.length === 0) return

    setConflictError(null)
    try {
      for (const fixedTrip of conflictFixedTrips) {
        await updateTripFixedMutation.mutateAsync({ tripId: fixedTrip.id, fixed: false })
      }
      await updateTripFixedMutation.mutateAsync({ tripId, fixed: true })
      setConflictFixedTrips([])
    } catch {
      setConflictError('일정 확정에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  const handleSaveTripInfo = () => {
    if (!tripId || !trip || updateTripMutation.isPending) return

    const trimmedName = nameInput.trim()
    const parsedCount = parseInt(personCountInput, 10)

    const nameChanged = trimmedName !== '' && trimmedName !== trip.name
    const countChanged =
      !Number.isNaN(parsedCount) &&
      parsedCount >= 1 &&
      parsedCount <= 6 &&
      parsedCount !== trip.personCount

    if (!nameChanged && !countChanged) return

    updateTripMutation.mutate(
      {
        tripId,
        request: {
          name: nameChanged ? trimmedName : null,
          personCount: countChanged ? parsedCount : null,
        },
      },
      {
        onError: () => {
          setHeaderError('저장에 실패했습니다.')
          setTimeout(() => setHeaderError(null), 3000)
        },
      },
    )
  }

  const handleBack = () => {
    if (trip?.tripThemeType) {
      navigate('/trips')
      return
    }
    navigate(-1)
  }

  const handleEditToggle = () => {
    if (editMode) {
      // 저장 버튼: trip info 저장 후 편집 모드 종료
      handleSaveTripInfo()
      setEditMode(false)
      setEditingPlanId(null)
      setShowRecommendSheet(false)
      setRecommendations([])
      setRecommendTarget(null)
    } else {
      // 편집 버튼: 현재 trip 값으로 input 초기화 후 편집 모드 진입
      setNameInput(trip?.name ?? '')
      setPersonCountInput(String(trip?.personCount ?? ''))
      setHeaderError(null)
      setEditMode(true)
      setFocusedPlanId(null)
      setFocusedTransportId(null)
    }
  }

  const handleEditCancel = () => {
    // 취소: input 원복 후 편집 모드 종료
    setNameInput(trip?.name ?? '')
    setPersonCountInput(String(trip?.personCount ?? ''))
    setHeaderError(null)
    setEditMode(false)
    setEditingPlanId(null)
    setShowRecommendSheet(false)
    setRecommendations([])
    setRecommendTarget(null)
  }

  const handleEditCardClick = (plan: PlacePlan) => {
    setEditingPlanId((prev) => (prev === plan.id ? null : plan.id))
  }

  const handleAIRecommendClick = (plan: PlacePlan) => {
    setRecommendTarget(plan)
    recommendMutation.mutate(
      {
        placePlanId: plan.id,
        placeType: plan.placeInfo.placeType,
        userLat: null,
        userLon: null,
        weather: null,
        time: null,
      },
      {
        onSuccess: (items) => {
          setRecommendations(items)
          setSelectedRecommendIndex(0)
          setShowRecommendSheet(true)
        },
      },
    )
  }

  const handleDeletePlan = (plan: PlacePlan) => {
    deleteMutation.mutate(plan.id, {
      onSuccess: () => {
        if (editingPlanId === plan.id) setEditingPlanId(null)
      },
    })
  }

  const handleRecommendConfirm = () => {
    if (!recommendTarget || !recommendations[selectedRecommendIndex]) return
    replaceMutation.mutate(
      {
        oldPlacePlanId: recommendTarget.id,
        newPlaceId: recommendations[selectedRecommendIndex].place.id,
      },
      {
        onSuccess: () => {
          setShowRecommendSheet(false)
          setRecommendations([])
          setRecommendTarget(null)
          setEditingPlanId(null)
          setEditMode(false)
        },
      },
    )
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

        {editMode ? (
          <div className="detail-header__fields">
            <input
              className="detail-header__name-input"
              type="text"
              aria-label="여행 제목"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={updateTripMutation.isPending}
              maxLength={50}
            />
            {headerError && (
              <span className="detail-header__error" role="alert">{headerError}</span>
            )}
          </div>
        ) : (
          <span className="detail-header__title">{trip.name}</span>
        )}
        {editMode && ( 
          <div className="detail-header__person-wrap">
            <input
              className="detail-header__person-input"
              type="number"
              aria-label="인원수"
              value={personCountInput}
              min={1}
              max={6}
              onChange={(e) => setPersonCountInput(e.target.value)}
              disabled={updateTripMutation.isPending}
            />
            <span className="detail-header__person-unit">명</span>
          </div>
        )}
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
        forceExpanded={editMode}
        mapContent={
          selectedPlans.length > 0
            ? (
              <TripRouteMap
                plans={selectedPlans}
                selectedDate={selectedDate}
                focusedPlanId={editMode ? editingPlanId : focusedPlanId}
                onMarkerClick={(planId) => {
                  if (editMode) {
                    setEditingPlanId(planId)
                  } else {
                    setFocusedPlanId((prev) => (prev === planId ? null : planId))
                    setFocusedTransportId(null)
                  }
                }}
                countryCode={trip.countryCode ?? undefined}
                highlightedTransportId={editMode ? null : focusedTransportId}
              />
            )
            : <MapPlaceholder label={trip.name} />
        }
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
          return (
            <TripScheduleView
              plans={selectedPlans}
              selectedDate={selectedDate ?? undefined}
              onDateChange={(date) => { setUserSelectedDate(date); setFocusedPlanId(null); setFocusedTransportId(null); setEditingPlanId(null) }}
              onPlaceClick={(plan) => { setFocusedPlanId((prev) => (prev === plan.id ? null : plan.id)); setFocusedTransportId(null) }}
              focusedPlanId={editMode ? editingPlanId : focusedPlanId}
              onTransportClick={(id) => setFocusedTransportId((prev) => (prev === id ? null : id))}
              focusedTransportId={focusedTransportId}
              editMode={editMode}
              onEditToggle={handleEditToggle}
              onEditCancel={handleEditCancel}
              onEditCardClick={handleEditCardClick}
              onAIRecommendClick={handleAIRecommendClick}
              onDeletePlan={handleDeletePlan}
            />
          )
        }}
      />

      {showRecommendSheet && recommendTarget && (
        <PlaceRecommendSheet
          originalPlanName={recommendTarget.placeInfo.name}
          recommendations={recommendations}
          selectedIndex={selectedRecommendIndex}
          onSelect={setSelectedRecommendIndex}
          onBack={() => { setShowRecommendSheet(false); setRecommendations([]) }}
          onConfirm={handleRecommendConfirm}
          isConfirming={replaceMutation.isPending}
          countryCode={trip.countryCode ?? undefined}
        />
      )}

      {conflictFixedTrips.length > 0 && (
        <>
          <button
            type="button"
            className="detail-fixed-conflict__backdrop"
            aria-label="일정 확정 팝업 닫기"
            onClick={handleCloseConflictModal}
            disabled={updateTripFixedMutation.isPending}
          />
          <section
            className="detail-fixed-conflict"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-fixed-conflict-title"
          >
            <p id="detail-fixed-conflict-title" className="detail-fixed-conflict__title">
              이미 같은 날짜에 확정된 일정이 있습니다
            </p>
            {conflictError && (
              <p className="detail-fixed-conflict__error">{conflictError}</p>
            )}
            <div className="detail-fixed-conflict__actions">
              <button
                type="button"
                className="detail-fixed-conflict__confirm"
                onClick={handleConfirmConflictFixed}
                disabled={updateTripFixedMutation.isPending}
              >
                {updateTripFixedMutation.isPending ? '처리 중...' : '이 일정 확정하기'}
              </button>
              <button
                type="button"
                className="detail-fixed-conflict__cancel"
                onClick={handleCloseConflictModal}
                disabled={updateTripFixedMutation.isPending}
              >
                취소
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
