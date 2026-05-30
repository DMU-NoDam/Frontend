import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LuArrowLeft, LuSparkles } from 'react-icons/lu'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { useTripPlans } from '@/features/trip/hooks/use-trip-plans'
import { useUpdateTripFixed } from '@/features/trip/hooks/use-update-trip-fixed'
import { useRecommendPlace } from '@/features/trip/hooks/use-recommend-place'
import { useReplacePlacePlan } from '@/features/trip/hooks/use-replace-place-plan'
import { useDeletePlacePlan } from '@/features/trip/hooks/use-delete-place-plan'
import { TripMapSheet, MapPlaceholder } from '@/features/trip/components/TripMapSheet'
import { TripRouteMap } from '@/features/trip/components/TripRouteMap'
import { TripScheduleView } from '@/features/trip/components/TripScheduleView'
import { PlaceRecommendSheet } from '@/features/trip/components/PlaceRecommendSheet'
import type { PlacePlan, RecommendedPlaceItem } from '@/features/trip/types/plan-types'
import { useBrowserChrome } from '@/shared/hooks/use-browser-chrome'
import './TripDetailPage.css'

export function TripDetailPage() {
  useBrowserChrome({
    safeTopColor: '#e8edf5',
    safeBottomColor: '#ffffff',
  })

  const { tripId } = useParams()
  const navigate   = useNavigate()

  const updateTripFixedMutation = useUpdateTripFixed()
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

  const [userSelectedDate, setUserSelectedDate]           = useState<string | null>(null)
  const [focusedPlanId, setFocusedPlanId]                 = useState<number | null>(null)
  const [focusedTransportId, setFocusedTransportId]       = useState<number | null>(null)
  const [editMode, setEditMode]                           = useState(false)
  const [editingPlanId, setEditingPlanId]                 = useState<number | null>(null)
  const [showRecommendSheet, setShowRecommendSheet]       = useState(false)
  const [recommendations, setRecommendations]             = useState<RecommendedPlaceItem[]>([])
  const [selectedRecommendIndex, setSelectedRecommendIndex] = useState(0)
  const [recommendTarget, setRecommendTarget]             = useState<PlacePlan | null>(null)

  const selectedDate = useMemo(
    () =>
      userSelectedDate && planDates.includes(userSelectedDate)
        ? userSelectedDate
        : (planDates[0] ?? null),
    [userSelectedDate, planDates],
  )

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

  const handleEditToggle = () => {
    if (editMode) {
      setEditMode(false)
      setEditingPlanId(null)
      setShowRecommendSheet(false)
      setRecommendations([])
      setRecommendTarget(null)
    } else {
      setEditMode(true)
      setFocusedPlanId(null)
      setFocusedTransportId(null)
    }
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
                    setFocusedPlanId(planId)
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
              onPlaceClick={(plan) => { setFocusedPlanId(plan.id); setFocusedTransportId(null) }}
              focusedPlanId={editMode ? editingPlanId : focusedPlanId}
              onTransportClick={(id) => setFocusedTransportId((prev) => (prev === id ? null : id))}
              focusedTransportId={focusedTransportId}
              editMode={editMode}
              onEditToggle={handleEditToggle}
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
    </main>
  )
}
